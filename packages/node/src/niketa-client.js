import execa from 'execa'
import { log } from 'helpers-fn'
import { createServer } from 'net'
import {
  filter,
  glue,
  pass,
  remove,
  tryCatch,
} from 'rambdax'

import { createFileKey } from './utils/create-file-key'
import { isLintOnlyMode } from './utils/is-lint-only-mode'
import { getCoveragePath } from './utils/get-coverage-path'
import { cleanJestOutput } from './utils/clean-jest-output.js'
import { extractConsoleLogs } from './utils/extract-console.logs'
import { getSpecFile } from './utils/get-spec-file.js'

const JEST_BIN = './node_modules/jest/bin/jest.js'
export const ERROR_ICON = '❌'
export const SUCCESS_ICON = '🐬'

function cleanAngularLog(x){
  return {
    ...x,
    stderr : remove(/ts-jest\[.+/, x.stderr),
  }
}

function toNumber(x){
  return x === undefined || Number.isNaN(Number(x)) ? 0 : Number(x)
}

function parse(x){
  const result = Math.round(x * 100) / 100

  return parseFloat(`${ result }`)
}

const maybeWarn = x => x < 0 ? `❗${ x }` : x

function extractNumber(text){
  const justText = text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '')

  return Number(justText.trim())
}

const defaultEmit = x => console.log(x, 'emit not yet initialized')

const messageSchema = {
  disableLint    : Boolean,
  withLockedFile : Boolean,
  fileName       : String,
  hasWallaby     : Boolean,
}

function isMessageCorrect(message){
  const isCorrect = pass(message)(messageSchema)
  if (!isCorrect){
    log('isMessageCorrect', 'error')

    return false
  }

  return true
}

function getUncoveredMessage(message){
  if (typeof message !== 'string' || !message){
    return
  }

  const uncovered = remove('...', message)

  return message.includes('...') ? `⛱${ uncovered }` : `☔${ uncovered }`
}

export class NiketaClient{
  constructor(port, emit){
    this.port = port
    this.serverInit = false
    this.coverageHolder = {}
    this.emit = emit === undefined ? defaultEmit : emit
    this.lintFileHolder = undefined
    this.fileHolder = undefined
    this.specFileHolder = undefined
  }

  async onJestMessage(message){
    const { disableLint, fileName, hasWallaby, dir } = message

    if (!isMessageCorrect(message)) return
    if (isLintOnlyMode(fileName)) return this.onLintOnlyMode(fileName)

    const maybeSpecFile = getSpecFile(fileName)
    const { canContinue } = this.markFileForLint({
      maybeSpecFile,
      disableLint,
      hasWallaby,
      fileName,
    })

    if (!canContinue) return
    if (this.stillWaitingForSpec(fileName, dir)) return

    const [
      failure,
      execResult,
      actualFileName,
      extension,
    ] = await this.execJest({
      dir,
      fileName     : this.fileHolder,
      specFileName : this.specFileHolder,
    })

    // if (failure) return 
    process.stderr.write('\n🐬\n' + execResult.stderr + '\n\n')
    process.stderr.write('\n🐬\n' + execResult.stdout + '\n\n')

    this.sendToVSCode({
      execResult,
      actualFileName,
      fileName : this.fileHolder,
      extension,
    })

    return true
  }

  sendToVSCode({ execResult, actualFileName, fileName, extension }){
    const hasError =
      execResult.stderr.startsWith('FAIL') ||
      execResult.stderr.includes('ERROR:')
    if (hasError){
      return this.emit({
        firstBarMessage : ERROR_ICON,
        hasDecorations  : false,
      })
    }

    const { pass, message, uncovered } = this.parseCoverage({
      execResult,
      actualFileName,
      fileName,
      extension,
    })
    const { newDecorations, hasDecorations } = this.getNewDecorations({
      execResult,
      fileName,
    })
    const firstBarMessage = pass ? message : ERROR_ICON
    const secondBarMessage = getUncoveredMessage(uncovered)

    this.emit({
      firstBarMessage,
      secondBarMessage,
      hasDecorations,
      newDecorations,
    })
  }

  getNewDecorations({ execResult, fileName }){
    const input = cleanJestOutput(execResult.stdout)
    const [ consoleLogs ] = input.split('----------------------|')
    const newDecorationsData = extractConsoleLogs(consoleLogs)

    if (Object.keys(newDecorationsData).length === 0){
      return { hasDecorations : false }
    }

    const newDecorations = this.evaluateDecorations({
      newDecorationsData,
      fileName,
    })

    return {
      hasDecorations : true,
      newDecorations,
    }
  }

  evaluateDecorations({ newDecorationsData, fileName }){
    const unreliableLogData = []
    const reliableLogData = {}

    const triggerFileHasDecoration = filter((logData, prop) => {
      const okLogData = fileName.endsWith(prop)

      logData.map(({ line, decoration }) => {
        unreliableLogData.push(decoration)
        if (okLogData){
          reliableLogData[ line ] = decoration
        }
      })

      return okLogData
    })(newDecorationsData)

    const correct = Object.keys(triggerFileHasDecoration).length === 1
    const logData = correct ? reliableLogData : unreliableLogData

    return {
      correct,
      logData,
    }
  }

  async execJest({ fileName, dir, specFileName }){
    const [ coveragePath, actualFileName, extension ] = getCoveragePath(dir,
      fileName)

    try {
      const testPattern = `-- ${ specFileName }`

      const command = [
        JEST_BIN,
        '-u',
        '--maxWorkers=1',
        '--env=node',
        '--collectCoverage=true',
        coveragePath,
        testPattern,
      ].join(' ')
      this.jestChild = execa.command(command, { cwd : dir })
      const result = await this.jestChild
      this.jestChild = undefined

      return [ false, result, actualFileName, extension ]
    } catch (e){
      if(e.isCanceled) return [false]
      if(!e.stdout) return [false] 
      if(!e.stderr) return [false]
       
      return [ true, {stdout: e.stdout, stderr: e.stderr},  actualFileName, extension ]
    }
  }

  parseCoverage({ execResult, actualFileName, fileName, extension }){
    const input = cleanAngularLog(execResult)
    const pass = input.stderr.includes('PASS')
    const jestOutputLines = input.stdout.split('\n')

    const [ line ] = jestOutputLines.filter(x =>
      x.includes(`${ actualFileName }${ extension }`))
    
    if (line === undefined){
      return {
        pass,
        message : SUCCESS_ICON,
      }
    }

    const [ , statements, branch, func, lines, uncovered ] = line
      .split('|')
      .map(extractNumber)

    const message = this.getCoverageDiff([ statements, branch, func, lines ], fileName)

    return {
      pass,
      message : message === undefined ? 'MESSAGE === undefined' : message,
      uncovered,
    }
  }

  getCoverageDiff(inputs, filePath){
    const fileKey = createFileKey(filePath)
    const firstTime = this.coverageHolder[ fileKey ] === undefined
    const [ statements, branch, func, lines ] = inputs.map(toNumber)

    const hash = {
      branch,
      func,
      lines,
      statements,
    }

    if (firstTime){
      this.coverageHolder[ fileKey ] = hash

      return glue(`
        🐰
        st:
        ${ statements }
        br:
        ${ branch }
        fn:
        ${ func }
        lns:
        ${ lines }
      `)
    }

    const statementsDiff = parse(statements - this.coverageHolder[ fileKey ].statements)
    const branchDiff = parse(branch - this.coverageHolder[ fileKey ].branch)
    const funcDiff = parse(func - this.coverageHolder[ fileKey ].func)
    const linesDiff = parse(lines - this.coverageHolder[ fileKey ].lines)

    this.coverageHolder[ fileKey ] = hash

    const message = glue(`
      ${ statementsDiff === 0 ? '' : `✍:${ maybeWarn(statementsDiff) }` }
      ${ branchDiff === 0 ? '' : `🎋:${ maybeWarn(branchDiff) }` }
      ${ funcDiff === 0 ? '' : `☈:${ maybeWarn(funcDiff) }` }
      ${ linesDiff === 0 ? '' : `📜:${ maybeWarn(linesDiff) }` }
    `)

    return message.trim() === '' ? '⛹' : message
  }

  logError(e, label){
    console.log({
      e,
      label,
    })
  }

  stillWaitingForSpec(fileName, dir){
    const stillWating = !(this.fileHolder && this.specFileHolder)
    const specBelongs = this.fileHolder.startsWith(dir)
    if (stillWating){
      // This happens only until the script receives a correct filepath
      this.debugLog('no specfile', fileName)

      return true
    }
    if (!specBelongs){
      // when we have filepath from previous project but not in the current

      this.debugLog(dir, 'still waiting for testable file in this project')

      return true
    }

    return false
  }

  onLintOnlyMode(fileName){
    console.log('onLintOnlyMode', fileName)
  }

  markFileForLint({ disableLint, fileName, hasWallaby, maybeSpecFile }){
    if (disableLint) return { canContinue : true }

    const allowLint =
      fileName !== this.lintFileHolder && this.lintFileHolder !== undefined

    if (allowLint){
      log(`LINT ${ this.lintFileHolder }`, 'box')
      // whenFileLoseFocus(lintFileHolder, disableLint)
      this.lintFileHolder = fileName
    } else {
      log(`SKIP_LINT ${
        this.lintFileHolder ? this.lintFileHolder : 'initial state'
      }`,
      'box')
    }

    if (hasWallaby){
      this.lintFileHolder = fileName

      this.debugLog(fileName, 'saved for lint later')

      return { canContinue : false }
    }

    if (maybeSpecFile){
      this.fileHolder = fileName
      this.lintFileHolder = fileName
      this.specFileHolder = maybeSpecFile
      this.debugLog(fileName, 'saved for lint later')

      return { canContinue : true }
    }
    this.debugLog(fileName, 'saved for lint later even without spec')

    // Even if the file has no corresponding spec file
    // we keep it for further linting
    this.lintFileHolder = fileName

    return { canContinue : false }
  }

  debugLog(data, label){}

  onCancelMessage({ fileName }){
    console.log('in cancel message', fileName)
    if (!this.jestChild) return
    if (!this.jestChild.cancel) return

    this.jestChild.cancel()
    this.jestChild = undefined
  }

  async onSocketData(messageFromVSCode){
    const parsedMessage = tryCatch(() => JSON.parse(messageFromVSCode.toString()),
      false)()
    if (parsedMessage === false){
      return this.onWrongIncomingMessage(messageFromVSCode.toString())
    }
    if (parsedMessage.requestCancelation){
      return this.onCancelMessage(parsedMessage)
    }
    const result = await this.onJestMessage(parsedMessage)

    return result
  }

  start(){
    if (this.serverInit) return
    this.server = createServer(socket => {
      log('Server created', 'info')
      socket.on('data', data => this.onSocketData(data.toString()))

      this.emit = message => {
        socket.write(JSON.stringify(message))
        socket.pipe(socket)
      }
      this.serverInit = true
    })

    log(`Listen at ${ this.port } for vscode`, 'back')
    this.server.listen(this.port, '127.0.0.1')
  }

  onWrongIncomingMessage(messageFromVSCode){
    return log('Error while parsing messageFromVSCode', 'error')
  }
}

/*
    async onMessageTest(message){
    console.log({ message })
    await delay(4000)
    const testUnreliableData = {
      correct : false,
      logData : [ 'foo', 'foo1', 'foo2', 'foo3' ],
    }

    const newDecorations = {
      correct : true,
      logData : {
        1 : 'foo',
        5 : 'foo1',
        6 : 'foo1',
        8 : 'foo2',
        9 : 'foo3',
      },
    }
    console.log('sending message')
    this.emit({
      newDecorations : testUnreliableData,
      firstStatusBar : 'Keep it up',
    })
  }

  const SHORT_SEPARATOR = repeat('🍄', 2).join``
const SEPARATOR = repeat('🍺', 20).join``

export function debugLog(toLog, label = 'debug log'){
  if (!getter('DEBUG_LOG')) return

  console.log(label, SHORT_SEPARATOR)
  console.log(SEPARATOR)
  console.log(toLog)
  console.log(SEPARATOR)
}

*/
