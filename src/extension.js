const vscode = require('vscode')
const {
  REQUEST_LINT_FILE,
  REQUEST_TEST_RUN,
  REQUEST_TEST_RUN_LEGACY,
} = require('./constants')
const { delay, getter, setter } = require('rambdax')
const { initExtension } = require('./worker')

const INIT_KEY = 'INIT'

function activate(context){
  let worker = {}

  const initNiketa = () => () => {
    worker = initExtension()
    if (getter(INIT_KEY)) return

    setter(INIT_KEY, true)
    worker.initStatusBars()
    worker.init()
  }

  const lintFileCommand = vscode.commands.registerCommand(REQUEST_LINT_FILE,
    () => {
      if (worker.requestLintFile) return worker.requestLintFile()

      initNiketa()()
      delay(1000).then(() => worker.requestLintFile())
    })

  const requestTestRunCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN,
    () => {
      if (worker.requestTestRun) return worker.requestTestRun()

      initNiketa()()
      delay(1000).then(() => worker.requestTestRun())
    })
  const requestTestRunLegacyCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN_LEGACY,
    () => {
      if (worker.requestTestRunLegacy) return worker.requestTestRunLegacy()

      initNiketa()()
      delay(1000).then(() => worker.requestThirdCommand())
    })

  context.subscriptions.push(lintFileCommand)
  context.subscriptions.push(requestTestRunCommand)
  context.subscriptions.push(requestTestRunLegacyCommand)
}

exports.activate = activate
