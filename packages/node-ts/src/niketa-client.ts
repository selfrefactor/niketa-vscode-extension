import {
  cleanAngularLog,
  defaultEmit,
  ERROR_ICON,
  extractNumber,
  isLintable,
  isMessageCorrect,
  JEST_BIN,
  LONG_SEPARATOR,
  maybeWarn,
  parse,
  SHORT_SEPARATOR,
  SUCCESS_ICON,
  toNumber,
} from './utils/common'
import execa from 'execa'
import {existsSync} from 'fs'
import {log} from 'helpers-fn'
import {lintFn} from 'lint-fn'
import {createServer} from 'net'
import {delay, glue, takeLast, remove, tryCatchAsync} from 'rambdax'
import {isLintOnlyMode, lintOnlyMode} from './modules/lint-only-mode'
import {createFileKey} from './utils/create-file-key'
import {getCoveragePath} from './utils/get-coverage-path'
import {getSpecFile} from './utils/get-spec-file'
import {getNewDecorations} from './utils/get-new-decorations'
import {getUncoveredMessage} from './utils/get-uncovered-message'
import {Message, JestSuccessMessage, ParseCoverage, NiketaClientInput} from './interfaces'

const EXTENDED_LOG = false

const FUNCTIONS = '☈' // 🕸
const STALE_SEPARATOR = '☄' // 🌰
const SEPARATOR = ' ' // 🎑 🔘 🧱
const STATEMENTS = '✍'
const BRANCHES = '🎋'
const LINES = '📜'

function logJest(execResult: any, enabled: boolean): void {
  if (!enabled) return

  process.stderr.write('\n🐬\n' + execResult.stderr + '\n🐬\n')
  process.stderr.write('\n🍵\n' + execResult.stdout + '\n🍵\n')
}

function fileInfo(x: string) {
  const [firstFolder, fileName] = takeLast(2, x.split('/'))

  return `${firstFolder}/${fileName}`
}

function onWrongIncomingMessage(message: Buffer) {
  console.log({
    message: message.toString(),
    type: typeof message,
  })

  return log('Error while parsing messageFromVSCode', 'error')
}

function debugLog(toLog: any, label = '') {
  if (!EXTENDED_LOG) return

  console.log(label, SHORT_SEPARATOR)
  console.log(LONG_SEPARATOR)
  console.log(toLog)
  console.log(LONG_SEPARATOR)
}

const baseEmitProps = {
  secondBarMessage: '',
  thirdBarMessage: '',
  hasDecorations: false,
  newDecorations: {
    correct: null,
    logData: '',
  }
}

export class NiketaClient {
  port: number
  testing: boolean
  coverageHolder: Record<string, any>
  emit: (x: any) => void
  initialized: boolean
  server: any
  jestChild: any
  pytestChild: any

  constructor(input: NiketaClientInput) {
    this.port = input.port
    this.testing = Boolean(input.testing)
    this.coverageHolder = {}
    this.emit = input.emit === undefined ? defaultEmit : input.emit
    this.initialized = false;
  }

  async onPytestMessage(message: Message){
    const { fileName, dir } = message
    
    try {
      const command = [
        `pipenv`,
        'run',
        `pytest`,
        fileName,
        '-v',
        '-rf',
        '--capture=no',
      ].join(' ')
      this.pytestChild = execa.command(command, {cwd: dir})
      log('sepx')
      log('Pytest start', 'info')
      const {stdout, stderr} = await this.pytestChild

      console.log(`stderr`, stderr)
      console.log(`stdout`, stdout)
      log('Pytest end', 'info')
      this.pytestChild = undefined
      this.emit({
        ...baseEmitProps,
        firstBarMessage: `SUCCESS - ${fileName}`,
        tooltip: stdout
      })
    } catch (e) {
      console.log(e, `pytest try.catch`)
      this.emit({
        ...baseEmitProps,
        firstBarMessage: 'FAILED',
      })
    }
  }
  async onJestMessage(message: Message){
    const { fileName, dir, hasTypescript, requestLintFile } = message

    if (!isMessageCorrect(message)){
      return this.emtpyAnswer(fileName, 'message is incorrect')
    }

    const lintOnly = isLintOnlyMode(fileName)
    const lintMessage = ` ${ fileInfo(fileName) }`

    /*
      Jest is setup for one of the two so we shouldn't check for both
    */
    const allowedSpecExtension = hasTypescript ? '.ts' : '.js'
    const { hasValidSpec, specFile } = getSpecFile(fileName,
      allowedSpecExtension)

    debugLog({
      lintOnly,
      hasValidSpec,
    })

    if (requestLintFile){
      debugLog('requestLintFile')

      return this.handleRequestLint({
        fileName,
        lintOnly,
        dir,
        lintMessage,
      })
    }

    if (lintOnly){
      debugLog('lintOnly')
      await lintOnlyMode(fileName)

      return this.lintAnswer(lintMessage)
    }

    if (!hasValidSpec) return this.emtpyAnswer(fileName, 'spec is not valid')

    const [
      failure,
      execResult,
      actualFileName,
      extension,
    ] = await this.execJest({
      dir,
      fileName     : fileName,
      specFileName : specFile,
    })

    if (failure){
      return this.emtpyAnswer(fileName,
        'Jest stopped for known or unknown reasons')
    }

    logJest(execResult, !this.testing)

    return this.onJestSuccess({
      specFile,
      dir,
      execResult,
      actualFileName,
      fileName,
      extension,
      hasTypescript,
    })
  }

  async handleRequestLint(input: {fileName: string, lintOnly: boolean, lintMessage: string, dir: string}) {
    const {fileName, lintOnly, lintMessage} = input
    
    if (!lintOnly && !isLintable(fileName)){
      return this.emtpyAnswer(fileName, '!lintable')
    }

    if (lintOnly){
      await lintOnlyMode(fileName)
      return this.lintAnswer(lintMessage)
    } 
    try {
      await this.applyLint(fileName)
      return this.lintAnswer(lintMessage)
    } catch (_) {
      return this.lintAnswer(`${ERROR_ICON} ${lintMessage}`)
    }
  }

  emtpyAnswer(fileName: string, reason: string) {
    debugLog(reason)
    this.emit({
      firstBarMessage: 'NO ACTION',
      secondBarMessage: undefined,
      thirdBarMessage: `${reason} - ${fileInfo(fileName)}`,
      hasDecorations: false,
    })
  }

  lintAnswer(lintMessage: string) {
    this.emit({
      firstBarMessage: 'LINT COMPLETED',
      secondBarMessage: undefined,
      thirdBarMessage: lintMessage,
      hasDecorations: false,
    })
  }

  async applyLint(fileName: string) {
    if (!existsSync(fileName)) return log(`${fileName} is deleted`, 'error')
    log('sep')
    log(`willLint ${fileName}`, 'info')
    
    // not ideal but it works for work-related TS files
    // await tryCatchAsync(lintFn, null)(fileName)

    // usual script
    const lintResult = await lintFn({
      filePath:fileName,
      prettierSpecialCase: 'local',
      cwdOverride: false,
      forceTypescript: true,
      debug:false
    })
    // console.log(lintResult, `lintResult`)
    // await tryCatchAsync(async x => lintFn(x, 'local', false, true), null)(fileName)

    log(`willLint ${fileName}`, 'success')
    log('sep')
  }

  onJestSuccess(input: JestSuccessMessage) {
    const {
      execResult,
      specFile,
      actualFileName,
      fileName,
      dir,
      extension,
      hasTypescript,
    } = input

    const hasError =
      execResult.stderr.startsWith('FAIL') ||
      execResult.stderr.includes('ERROR:')

    const {pass, message, uncovered} = this.parseCoverage({
      execResult,
      hasError,
      actualFileName,
      fileName,
      extension,
    })
    const {newDecorations, hasDecorations} = getNewDecorations({
      execResult,
      fileName,
      hasTypescript,
    })
    const firstBarMessage = pass ? message : ERROR_ICON
    const secondBarMessage = getUncoveredMessage(uncovered)

    debugLog(
      {
        pass,
        hasTypescript,
        message,
        hasError,
        newDecorations,
        hasDecorations,
      },
      'vscode.message'
    )
    const shorterSpecFile = remove(dir, specFile)
    
    this.emit({
      firstBarMessage,
      secondBarMessage,
      thirdBarMessage: shorterSpecFile,
      hasDecorations,
      newDecorations,
    })
  }

  async execJest(input: {fileName: string, dir: string, specFileName: string}) {
    const {fileName, dir, specFileName} = input
    const [coveragePath, actualFileName, extension] = getCoveragePath(
      dir,
      fileName
    )

    try {
      const testPattern = `-- ${specFileName}`

      const command = [
        JEST_BIN,
        '-u',
        '--detectOpenHandles',
        '--maxWorkers=1',
        '--env=node',
        '--collectCoverage=true',
        coveragePath,
        testPattern,
      ].join(' ')
      this.jestChild = execa.command(command, {cwd: dir})
      log('sepx')
      log('Jest start', 'info')
      const result = await this.jestChild
      log('Jest end', 'info')
      this.jestChild = undefined

      return [false, result, actualFileName, extension]
    } catch (e: any) {
      if (e.isCanceled) return [true]
      if (!e.stdout) return [true]
      if (!e.stderr) return [true]

      return [
        false,
        {
          stdout: e.stdout,
          stderr: e.stderr,
        },
        actualFileName,
        extension,
      ]
    }
  }

  parseCoverage(parseCoverageInput: ParseCoverage) {
    const {
      execResult,
      actualFileName,
      fileName,
      extension,
      hasError,
    } = parseCoverageInput
    if (hasError) return {}
    
    const input = cleanAngularLog(execResult)
    const pass = input.stderr.includes('PASS')
    const jestOutputLines = input.stdout.split('\n')

    let foundCoverage = false
    const [lineWithCoverage] = jestOutputLines.filter(line => {
      if (line.includes('% Stmts')) foundCoverage = true

      return foundCoverage && line.includes(`${actualFileName}${extension}`)
    })

    if (lineWithCoverage === undefined) {
      return {
        pass,
        message: SUCCESS_ICON,
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

    const message = this.getCoverageDiff(
      [statements, branch, func, lines],
      fileName
    )

    return {
      pass,
      message: message === undefined ? 'MESSAGE === undefined' : message,
      uncovered,
    }
  }

  getCoverageDiff(inputs: any[], filePath: string) {
    const fileKey = createFileKey(filePath)
    const firstTime = this.coverageHolder[fileKey] === undefined
    const [statements, branch, func, lines] = inputs.map(toNumber)

    const hash = {
      branch,
      func,
      lines,
      statements,
    }

    const coverageInfo = glue(`
    statements ${STATEMENTS}:
    ${statements} % ${SEPARATOR}
    branches ${BRANCHES}:
    ${branch} % ${SEPARATOR}
    functions ${FUNCTIONS}:
    ${func} % ${SEPARATOR}
    lines ${LINES}:
    ${lines} %
  `)

    if (firstTime) {
      this.coverageHolder[fileKey] = hash

      return coverageInfo
    }

    const statementsDiff = parse(
      statements - this.coverageHolder[fileKey].statements
    )
    const branchDiff = parse(branch - this.coverageHolder[fileKey].branch)
    const funcDiff = parse(func - this.coverageHolder[fileKey].func)
    const linesDiff = parse(lines - this.coverageHolder[fileKey].lines)

    this.coverageHolder[fileKey] = hash

    const message = glue(`
      ${statementsDiff === 0 ? '' : `✍:${maybeWarn(statementsDiff)}`}
      ${branchDiff === 0 ? '' : `🎋:${maybeWarn(branchDiff)}`}
      ${funcDiff === 0 ? '' : `☈:${maybeWarn(funcDiff)}`}
      ${linesDiff === 0 ? '' : `📜:${maybeWarn(linesDiff)}`}
    `)

    const staleCoverageInfo = glue(`
    NO CHANGE ${STALE_SEPARATOR}
    ${STATEMENTS}:
    ${statements} % ${STALE_SEPARATOR}
    ${BRANCHES}:
    ${branch} % ${STALE_SEPARATOR}
    ${FUNCTIONS}:
    ${func} % ${STALE_SEPARATOR}
    ${LINES}:
    ${lines} %
  `)

    return message.trim() === '' ? staleCoverageInfo : `change: ${message}`
  }

  onCancelMessage() {
    if (!this.jestChild) return log('', 'error')
    if (!this.jestChild.cancel) return

    this.jestChild.cancel()
    this.jestChild = undefined
  }

  async onSocketData(messageFromVSCode: any) {
    let parsedMessage: false | Message

    try {
      parsedMessage = JSON.parse(messageFromVSCode.toString())
    } catch (_) {
      parsedMessage = false
    }

    if (parsedMessage === false) {
      return onWrongIncomingMessage(messageFromVSCode.toString())
    }

    debugLog(parsedMessage, 'onSocketData')

    if (parsedMessage.requestCancelation) {
      return this.onCancelMessage()
    }
    if(parsedMessage.fileName.endsWith('.py')){
      await this.onPytestMessage(parsedMessage)
      return
    }
    await this.onJestMessage(parsedMessage)
  }

  start() {
    log(this.initialized ? 'Already initialized' : 'start niketa TDD tool', 'box')
    this.server = createServer(socket => {
      this.initialized = true

      socket.on('data', data => this.onSocketData(data.toString()))

      socket.on('error', err => {
        this.initialized = false
        console.log(err, 'socket.error.niketa.client')
        this.server.close(() => {
          console.log('niketa TDD closed')
          delay(2000).then(() => {
            console.log('niketa TDD will restart')
            this.start()
          })
        })
      })

      this.emit = message => {
        socket.write(JSON.stringify(message))
        socket.pipe(socket)
      }
    })

    this.server.listen(this.port, '127.0.0.1')
  }
}
