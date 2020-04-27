import execa from 'execa'
import { existsSync } from 'fs'
import { log } from 'helpers-fn'
import { lintFn } from 'lint-fn'
import { createServer } from 'net'
import { delay, filter, glue, tryCatch } from 'rambdax'

import { extractConsoleLogs } from './modules/extract-console-logs'
import { lintOnlyMode } from './modules/lint-only-mode'
import { cleanJestOutput } from './utils/clean-jest-output.js'
import {
  cleanAngularLog,
  defaultEmit,
  ERROR_ICON,
  extractNumber,
  isJestable,
  isMessageCorrect,
  isWorkFile,
  JEST_BIN,
  maybeWarn,
  parse,
  SEPARATOR,
  SHORT_SEPARATOR,
  SUCCESS_ICON,
  toNumber,
} from './utils/common'
import { createFileKey } from './utils/create-file-key'
import { getCoveragePath } from './utils/get-coverage-path'
import { getSpecFile } from './utils/get-spec-file.js'
import { getUncoveredMessage } from './utils/get-uncovered-message'
import { isLintOnlyMode } from './utils/is-lint-only-mode'

const EXTENDED_LOG = false

export class NiketaClient{
  constructor({ port, emit, testing }){
    this.port = port
    this.testing = testing
    this.serverInit = false
    this.coverageHolder = {}
    this.lastLintedFiles = []
    this.emit = emit === undefined ? defaultEmit : emit
    this.lintFileHolder = undefined
    this.lintOnlyFileHolder = undefined
    this.fileHolder = undefined
    this.specFileHolder = undefined
  }

  async onJestMessage(message){
    const { fileName, hasWallaby, dir, forceLint, hasTypescript } = message
    if (!isMessageCorrect(message)) return this.emtpyAnswer()

    const disableLint = isWorkFile(fileName)
    const lintOnly = isLintOnlyMode(fileName)
    const jestable = isJestable(fileName)

    if (lintOnly || !jestable){
      // As response to VSCode could be too  fast
      // ============================================
      await delay(500)
      if (disableLint) return this.emtpyAnswer()

      if (this.lintOnlyFileHolder){
        await lintOnlyMode(this.lintOnlyFileHolder)
        this.markLint(this.lintOnlyFileHolder)
        this.lintOnlyFileHolder = undefined
      }
      if (this.lintFileHolder){
        await this.whenFileLoseFocus(this.lintFileHolder)
        this.lintFileHolder = undefined
      }

      if (lintOnly) this.lintOnlyFileHolder = fileName

      return this.emtpyAnswer()
    }

    if (this.lintOnlyFileHolder){
      lintOnlyMode(this.lintOnlyFileHolder, lintedFile => {
        this.markLint(lintedFile)
      })
    }

    // Check that if project `hasTypescript` is false
    // then we can check only for `.js` file
    const maybeSpecFile = getSpecFile(fileName,
      hasTypescript ? '.ts' : '.js')

    const { canContinue } = this.evaluateLint({
      maybeSpecFile,
      forceLint,
      disableLint,
      hasWallaby,
      hasTypescript,
      fileName,
    })

    if (!canContinue) return this.emtpyAnswer()
    if (this.stillWaitingForSpec(fileName, dir)) return this.emtpyAnswer()

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

    if (failure) return this.emtpyAnswer()
    this.logJest(execResult)

    this.sendToVSCode({
      execResult,
      actualFileName,
      fileName : this.fileHolder,
      extension,
      hasTypescript,
    })
  }

  emtpyAnswer(){
    this.emit({
      firstBarMessage  : '',
      secondBarMessage : undefined,
      hasDecorations   : false,
    })
  }

  logJest(execResult){
    if (this.testing) return
    process.stderr.write('\n🐬\n' + execResult.stderr + '\n🐬\n')
    process.stderr.write('\n🍵\n' + execResult.stdout + '\n🍵\n')
  }

  markLint(fileName){
    if (!this.testing) return

    this.lastLintedFiles.push(fileName)
  }

  async whenFileLoseFocus(fileName){
    if (!existsSync(fileName)) return
    log('sep')
    log(`willLint ${ fileName }`, 'info')
    log('sep')

    await lintFn(fileName)
    this.markLint(fileName)
  }

  sendToVSCode({
    execResult,
    actualFileName,
    fileName,
    extension,
    hasTypescript,
  }){
    const hasError =
      execResult.stderr.startsWith('FAIL') ||
      execResult.stderr.includes('ERROR:')

    const { pass, message, uncovered } = this.parseCoverage({
      execResult,
      hasError,
      actualFileName,
      fileName,
      extension,
    })
    console.log({uncovered})
    const { newDecorations, hasDecorations } = this.getNewDecorations({
      execResult,
      fileName,
      hasTypescript,
    })
    const firstBarMessage = pass ? message : ERROR_ICON
    const secondBarMessage = getUncoveredMessage(uncovered)

    this.debugLog({
      pass,
      hasTypescript,
      message,
      hasError,
      newDecorations,
      hasDecorations,
    },
    'vscode.message')

    this.emit({
      firstBarMessage,
      secondBarMessage,
      hasDecorations,
      newDecorations,
    })
  }

  getNewDecorations({ execResult, fileName, hasTypescript }){
    const input = cleanJestOutput(execResult.stdout)
    const [ consoleLogs ] = input.split('----------------------|')
    const newDecorationsData = extractConsoleLogs(consoleLogs)
    if (Object.keys(newDecorationsData).length === 0){
      return { hasDecorations : false }
    }

    const newDecorations = this.evaluateDecorations({
      newDecorationsData,
      fileName,
      hasTypescript,
    })

    return {
      hasDecorations : true,
      newDecorations,
    }
  }

  evaluateDecorations({ newDecorationsData, fileName, hasTypescript }){
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

    const correct =
      !hasTypescript && Object.keys(triggerFileHasDecoration).length === 1
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
      log('Jest start', 'info')
      const result = await this.jestChild
      log('Jest end', 'info')
      this.jestChild = undefined

      return [ false, result, actualFileName, extension ]
    } catch (e){
      if (e.isCanceled) return [ true ]
      if (!e.stdout) return [ true ]
      if (!e.stderr) return [ true ]

      return [
        false,
        {
          stdout : e.stdout,
          stderr : e.stderr,
        },
        actualFileName,
        extension,
      ]
    }
  }

  parseCoverage({
    execResult,
    actualFileName,
    fileName,
    extension,
    hasError,
  }){
    if (hasError) return {}
    const input = cleanAngularLog(execResult)
    const pass = input.stderr.includes('PASS')
    const jestOutputLines = input.stdout.split('\n')

    let foundCoverage = false
    const [ lineWithCoverage ] = jestOutputLines.filter(line => {
      if (line.includes('% Stmts')) foundCoverage = true

      return foundCoverage && line.includes(`${ actualFileName }${ extension }`)
    })

    if (lineWithCoverage === undefined){
      return {
        pass,
        message : SUCCESS_ICON,
      }
    }

    const [
      ,
      statements,
      branch,
      func,
      lines,
      uncovered,
    ] = lineWithCoverage.split('|').map(extractNumber)
    const message = this.getCoverageDiff([ statements, branch, func, lines ],
      fileName)

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
    if (stillWating){
      // This happens only until the script receives a correct filepath
      this.debugLog('no specfile', fileName)

      return true
    }

    const specBelongs = this.fileHolder.startsWith(dir)

    if (!specBelongs){
      // when we have filepath from previous project but not in the current
      this.debugLog(dir, 'still waiting for testable file in this project')

      return true
    }

    return false
  }

  evaluateLint({
    disableLint,
    fileName,
    hasWallaby,
    hasTypescript,
    maybeSpecFile,
    forceLint,
  }){
    if (disableLint) return { canContinue : true }

    // If project is not Typescript, then there is no need to run lint on TS files
    if (!hasTypescript && fileName.endsWith('.ts'))
      return { canContinue : true }

    const allowLint =
      fileName !== this.lintFileHolder && this.lintFileHolder !== undefined

    if (allowLint){
      this.whenFileLoseFocus(this.lintFileHolder)
      this.lintFileHolder = fileName
    } else if (forceLint){
      this.whenFileLoseFocus(fileName)
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
      this.specFileHolder = maybeSpecFile
      this.fileHolder = fileName
      this.lintFileHolder = fileName
      this.debugLog(fileName, 'saved for lint later')

      return { canContinue : true }
    }

    this.debugLog(fileName, 'saved for lint later even without spec')

    // Even if the file has no corresponding spec file
    // we keep it for further linting
    this.lintFileHolder = fileName

    // This defines if editing JS/TS file with no corresponding spec
    // we still want the last test to run again
    // Initially the return value is `false`
    // ============================================
    return { canContinue : true }
  }

  debugLog(toLog, label){
    if (!EXTENDED_LOG) return

    console.log(label, SHORT_SEPARATOR)
    console.log(SEPARATOR)
    console.log(toLog)
    console.log(SEPARATOR)
  }

  onCancelMessage({ fileName }){
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

    log(parsedMessage, 'obj')

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
      socket.on('error', err => {
        console.log(err, 'socket.error.niketa.client')
        this.server.close(() => {
          this.serverInit = false
          delay(2000).then(() => {
            this.start()
          })
        })
      })
      this.emit = message => {
        socket.write(JSON.stringify(message))
        socket.pipe(socket)
      }
      this.serverInit = true
    })

    log(`Listen at ${ this.port } for vscode`, 'back')
    this.server.listen(this.port, '127.0.0.1')
  }

  onWrongIncomingMessage(message){
    console.log({
      message : message.toString(),
      type    : typeof message,
    })

    return log('Error while parsing messageFromVSCode', 'error')
  }
}
