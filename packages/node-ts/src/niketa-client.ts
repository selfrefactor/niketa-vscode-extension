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
import {log} from 'helpers-fn'
import {createServer} from 'net'
import {delay, glue, takeLast, remove} from 'rambdax'
import {isLintOnlyMode, lintOnlyMode} from './modules/lint-only-mode'
import {createFileKey} from './utils/create-file-key'
import {getCoveragePath} from './utils/get-coverage-path'
import {getSpecFile} from './utils/get-spec-file'
import {getNewDecorations} from './utils/get-new-decorations'
import {getUncoveredMessage} from './utils/get-uncovered-message'
import {
  Message,
  JestSuccessMessage,
  ParseCoverage,
  NiketaClientInput,
} from './interfaces'
import {applyLint, applyRomeLint} from './apply-lint'

const EXTENDED_LOG = process.env.NIKETA_CLIENT_EXTENDED_LOG === `ON`

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
  },
}

export class NiketaClient {
  port: number
  testing: boolean
  coverageHolder: Record<string, any>
  emit: (x: any) => void
  initialized: boolean
  server: any
  jestChild: any
  pythonTestChild: any
  golangTestChild: any

  constructor(input: NiketaClientInput) {
    this.port = input.port
    this.testing = Boolean(input.testing)
    this.coverageHolder = {}
    this.emit = input.emit === undefined ? defaultEmit : input.emit
    this.initialized = false
  }
  async onPythonMypyMessage({
    message,
    strict,
  }: {
    message: Message
    strict: boolean
  }) {
    const {fileName, dir} = message
    let relativePath = remove(dir + '/', fileName)
    // todo: modularize
    try {
      const command = [
        `pipenv`,
        'run',
        `mypy`,
        strict ? '--strict' : '',
        '--config-file',
        'mypy.ini',
        relativePath,
      ]
        .filter(Boolean)
        .join(' ')
      this.pythonTestChild = execa.command(command, {cwd: dir})
      log('sepx')
      log('Mypy start', 'info')
      const {stdout, stderr} = await this.pythonTestChild

      console.log(`stderr`, stderr)
      console.log(`stdout`, stdout)
      log('Mypy end', 'info')
      this.pythonTestChild = undefined
      this.emit({
        ...baseEmitProps,
        firstBarMessage: `SUCCESS MYPY - ${relativePath}`,
        tooltip: stdout,
      })
    } catch (e: any) {
      console.log(e.stdout, `mypy try.catch`)
      this.emit({
        ...baseEmitProps,
        firstBarMessage: `FAILED MYPY - ${relativePath}`,
        tooltip: e.stdout ?? 'missing output',
      })
    }
  }
  async onPythonLintMessage(message: Message) {
    function getLintCommands(relativePath: string) {
      const configFile = `.pylintrc`

      return {
        autopep8: `pipenv run autopep8 --in-place --aggressive --verbose --max-line-length 120 ${relativePath}`,
        pylint: `pipenv run pylint --rcfile=${configFile} ${relativePath}`,
      }
    }
    const {fileName, dir} = message
    let relativePath = remove(dir + '/', fileName)
    // todo: modularize
    try {
      const commands = getLintCommands(relativePath)
      this.pythonTestChild = execa.command(commands.autopep8, {cwd: dir})
      log('sepx')
      log('Pylint start', 'info')
      const {stdout, stderr} = await this.pythonTestChild
      this.pythonTestChild = execa.command(commands.pylint, {cwd: dir})
      const {stdout: stdout2, stderr: stderr2} = await this.pythonTestChild
      console.log(`stderr`, stderr)
      console.log(`stdout`, stdout)
      console.log(`stderr2`, stderr2)
      console.log(`stdout2`, stdout2)
      log('Pylint end', 'info')
      this.pythonTestChild = undefined
      this.emit({
        ...baseEmitProps,
        firstBarMessage: `SUCCESS LINT - ${relativePath}`,
        tooltip: stdout + '\n' + stdout2,
      })
    } catch (e: any) {
      console.log(e, `lint try.catch`)
      this.emit({
        ...baseEmitProps,
        firstBarMessage: `FAILED LINT - ${relativePath}`,
        tooltip: e.stdout ?? 'missing output',
      })
    }
  }

  async onPythonTestMessage(message: Message) {
    const {fileName, dir} = message

    try {
      const command = [
        `pipenv`,
        'run',
        `pytest`,
        fileName,
        '-v',
        '-rf',
        '--capture=no',
        '--continue-on-collection-errors',
      ].join(' ')
      this.pythonTestChild = execa.command(command, {cwd: dir})
      log('sepx')
      log('Pytest start', 'info')
      const {stdout, stderr} = await this.pythonTestChild

      console.log(`stderr`, stderr)
      console.log(`stdout`, stdout)
      log('Pytest end', 'info')
      this.pythonTestChild = undefined
      this.emit({
        ...baseEmitProps,
        firstBarMessage: `SUCCESS - ${fileName}`,
        tooltip: stdout,
      })
    } catch (e) {
      console.log(e, `pytest try.catch`)
      this.emit({
        ...baseEmitProps,
        firstBarMessage: 'FAILED',
      })
    }
  }
  async onPythonMessage(message: Message) {
    if (message.requestLintFile) return this.onPythonLintMessage(message)
    if (message.requestThirdCommand)
      return this.onPythonMypyMessage({strict: true, message})
    return this.onPythonTestMessage(message)
  }

  async onGolangMessage(message: Message) {
    console.log(`message`, message)
    throw new Error('Not implemented')
  }

  async onFrontendMessage(message: Message) {
    const {fileName, dir, hasTypescript, requestLintFile} = message

    if (!isMessageCorrect(message)) {
      return this.emptyAnswer(fileName, 'message is incorrect')
    }
    // lintOnly is for files such as HTML, CSS, etc.
    const lintOnly = isLintOnlyMode(fileName)
    const lintMessage = ` ${fileInfo(fileName)}`

    /*
      Jest is setup for one of the two so we shouldn't check for both
    */
    const allowedSpecExtension = hasTypescript ? '.ts' : '.js'
    const {hasValidSpec, specFile} = getSpecFile(
      fileName,
      allowedSpecExtension
    )

    debugLog({
      lintOnly,
      hasValidSpec,
    })

    if (requestLintFile) {
      debugLog('requestLintFile')

      return this.handleRequestLint({
        fileName,
        lintOnly,
        dir,
        lintMessage,
      })
    }

    if (lintOnly) {
      debugLog('lintOnly')
      const lintResult = await lintOnlyMode(fileName)

      return this.lintAnswer(lintMessage, lintResult)
    }

    if (!hasValidSpec) return this.emptyAnswer(fileName, 'spec is not valid')

    const [failure, execResult, actualFileName, extension] =
      await this.execJest({
        dir,
        fileName: fileName,
        specFileName: specFile,
      })

    if (failure) {
      return this.emptyAnswer(
        fileName,
        'Jest stopped for known or unknown reasons'
      )
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

  async handleRequestLint(input: {
    fileName: string
    lintOnly: boolean
    lintMessage: string
    dir: string
  }) {
    const {fileName, lintOnly, lintMessage, dir} = input
    if (!lintOnly && !isLintable(fileName)) {
      return this.emptyAnswer(fileName, '!lintable')
    }

    if (lintOnly) {
      const lintSuccess = await lintOnlyMode(fileName)
      return this.lintAnswer(lintMessage, lintSuccess)
    }
    try {
      await applyRomeLint(fileName, dir)
      const withoutForceTS = await applyLint(fileName, false)
      if (withoutForceTS) {
        return this.lintAnswer(lintMessage, true)
      }
      const lintSuccess = await applyLint(fileName, true)
      return this.lintAnswer(lintMessage, lintSuccess)
    } catch (_) {
      return this.lintAnswer(lintMessage, false)
    }
  }

  emptyAnswer(fileName: string, reason: string) {
    debugLog(reason)
    this.emit({
      firstBarMessage: 'NO ACTION',
      secondBarMessage: undefined,
      thirdBarMessage: `${reason} - ${fileInfo(fileName)}`,
      hasDecorations: false,
    })
  }

  lintAnswer(lintMessage: string, success?: boolean) {
    this.emit({
      firstBarMessage:
        success === false ? `${ERROR_ICON} LINT FAILED` : 'LINT COMPLETED',
      secondBarMessage: undefined,
      thirdBarMessage: lintMessage,
      hasDecorations: false,
    })
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

  async execJest(input: {
    fileName: string
    dir: string
    specFileName: string
  }) {
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
    const {execResult, actualFileName, fileName, extension, hasError} =
      parseCoverageInput
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

    const [, statements, branch, func, lines, uncovered] = lineWithCoverage
      .split('|')
      .map(extractNumber)

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

    if (parsedMessage.fileName.endsWith('.py')) {
      await this.onPythonMessage(parsedMessage)
      return
    }
    if (parsedMessage.fileName.endsWith('.go')) {
      await this.onGolangMessage(parsedMessage)
      return
    }
    await this.onFrontendMessage(parsedMessage)
  }

  start() {
    log(
      this.initialized ? 'Already initialized' : 'start niketa TDD tool',
      'box'
    )
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
