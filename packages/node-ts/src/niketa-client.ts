import execa from 'execa'
import {existsSync} from 'fs'
import {log} from 'helpers-fn'
import {lintFn} from 'lint-fn'
import {createServer} from 'net'
import {delay, glue, takeLast, tryCatch} from 'rambdax'

import {isLintOnlyMode, lintOnlyMode} from './modules/lint-only-mode'
import {
  cleanAngularLog,
  defaultEmit,
  ERROR_ICON,
  extractNumber,
  isLintable,
  isMessageCorrect,
  isWorkFile,
  JEST_BIN,
  LONG_SEPARATOR,
  maybeWarn,
  parse,
  SHORT_SEPARATOR,
  SUCCESS_ICON,
  toNumber,
} from './utils/common'
import {createFileKey} from './utils/create-file-key'
import {getCoveragePath} from './utils/get-coverage-path'
import {getSpecFile} from './utils/get-spec-file'
import {getNewDecorations} from './utils/get-new-decorations'
import {getUncoveredMessage} from './utils/get-uncovered-message'

const EXTENDED_LOG = true

const FUNCTIONS = '🕸' // ☈
const STALE_SEPARATOR = '☄' // '🌰'
const SEPARATOR = '🧱' // '🎑 🔘'
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

export class NiketaClient {
  port: number
  testing: boolean
  coverageHolder: object
  lastLintedFiles: string[]
  lintActionBusy: boolean
  emit: object
  initialized: boolean

  constructor(input: NiketaClientInput) {
    this.port = input.port
    this.testing = Boolean(input.testing)
    this.coverageHolder = {}
    this.lastLintedFiles = []
    this.lintActionBusy = false
    this.emit = input.emit === undefined ? defaultEmit : input.emit
    this.initialized = false
  }

  async onJestMessage(message: Message) {
    const {
      fileName,
      dir,
      hasTypescript,
      requestLintFile,
      forceLint,
    } = message
    if (!isMessageCorrect(message)) {
      return this.emtpyAnswer(fileName, 'message')
    }

    const disableLint = isWorkFile(fileName)
    const lintOnly = isLintOnlyMode(fileName)
    const canLint = isLintable(fileName)
    const lintMessage = ` ${fileInfo(fileName)}`

    /*
      Jest is setup for one of the two so we shouldn't check for both
    */
    const allowedSpecExtension = hasTypescript ? '.ts' : '.js'
    const {hasValidSpec, specFile} = getSpecFile(
      fileName,
      allowedSpecExtension
    )

    debugLog({disableLint, lintOnly, canLint, hasValidSpec})

    if (requestLintFile) {
      debugLog('requestLintFile')
      return this.handleRequestLint({
        fileName,
        lintOnly,
        lintMessage,
      })
    }

    if (lintOnly && !disableLint) {
      debugLog('lintOnly && !disableLint')
      await lintOnlyMode(fileName)

      return this.lintAnswer(fileName, lintMessage)
    }

    if (!hasValidSpec && disableLint) {
      debugLog('!hasValidSpec && disableLint')
      return this.emtpyAnswer(fileName, 'lint is disabled')
    }

    if (!hasValidSpec && !canLint) {
      debugLog('!hasValidSpec && !canLint')

      return this.emtpyAnswer(fileName, 'skip')
    }

    if (forceLint && canLint) {
      if (this.lintActionBusy) {
        debugLog('lint is busy')
      } else {
        debugLog('lint is possible')
        this.lintActionBusy = true
        this.applyLint(fileName)
        this.markLint(fileName)
      }
    }

    if (!hasValidSpec) return this.emtpyAnswer(fileName, '!hasValidSpec')

    const [
      failure,
      execResult,
      actualFileName,
      extension,
    ] = await this.execJest({
      dir,
      fileName: fileName,
      specFileName: specFile,
    })
    this.lintActionBusy = false

    if (failure)
      return this.emtpyAnswer(
        fileName,
        'Jest stopped for known or unknown reasons'
      )
    logJest(execResult, !this.testing)

    return this.sendToVSCode({
      specFile,
      execResult,
      actualFileName,
      fileName,
      extension,
      hasTypescript,
    })
  }

  async handleRequestLint({fileName, lintOnly, lintMessage}) {
    if (lintOnly) {
      await lintOnlyMode(fileName)
    } else {
      await this.applyLint(fileName)
    }

    return this.lintAnswer(fileName, lintMessage)
  }

  emtpyAnswer(fileName, reason) {
    debugLog(reason)
    this.emit({
      firstBarMessage: 'NO ACTION',
      secondBarMessage: undefined,
      thirdBarMessage: fileInfo(fileName),
      hasDecorations: false,
    })
  }

  lintAnswer(fileName, lintMessage) {
    this.markLint(fileName)

    this.emit({
      firstBarMessage: 'LINT ACTION',
      secondBarMessage: undefined,
      thirdBarMessage: lintMessage,
      hasDecorations: false,
    })
    // this.resetServer()
  }

  markLint(fileName) {
    if (!this.testing) return

    this.lastLintedFiles.push(fileName)
  }

  async applyLint(fileName) {
    if (!existsSync(fileName)) return log(`${fileName} is deleted`, 'error')
    log('sep')
    log(`willLint ${fileName}`, 'info')
    log('sep')

    await lintFn(fileName)
  }

  sendToVSCode({
    execResult,
    specFile,
    actualFileName,
    fileName,
    extension,
    hasTypescript,
  }) {
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

    this.emit({
      firstBarMessage,
      secondBarMessage,
      thirdBarMessage: specFile,
      hasDecorations,
      newDecorations,
    })
    // this.resetServer()
  }

  async execJest({fileName, dir, specFileName}) {
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
      log('Jest start', 'info')
      const result = await this.jestChild
      log('Jest end', 'info')
      this.jestChild = undefined

      return [false, result, actualFileName, extension]
    } catch (e) {
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

  parseCoverage({
    execResult,
    actualFileName,
    fileName,
    extension,
    hasError,
  }) {
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

  getCoverageDiff(inputs, filePath) {
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

  async onSocketData(messageFromVSCode) {
    const parsedMessage = tryCatch(
      () => JSON.parse(messageFromVSCode.toString()),
      false
    )()

    if (parsedMessage === false) {
      return onWrongIncomingMessage(messageFromVSCode.toString())
    }

    debugLog(parsedMessage, 'onSocketData')

    if (parsedMessage.requestCancelation) {
      return this.onCancelMessage()
    }

    await this.onJestMessage(parsedMessage)
  }

  resetServer() {
    delay(500).then(() => {
      this.server.close(() => {
        delay(500).then(() => {
          this.start()
        })
      })
    })
  }

  start() {
    if (this.initialized) log('Already initialized', 'box')
    this.server = createServer(socket => {
      this.initialized = true

      socket.on('data', data => this.onSocketData(data.toString()))

      socket.on('error', err => {
        this.initialized = false
        console.log(err, 'socket.error.niketa.client')
        this.server.close(() => {
          delay(2000).then(() => {
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