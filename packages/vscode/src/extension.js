const vscode = require('vscode')
const { initExtension } = require('./worker')
const { getter, setter, delay } = require('rambdax')
const { REQUEST_CANCELATION, REQUEST_TEST_RUN, REQUEST_LINT_FILE, START_AUTO_MODE} = require('./constants')

const INIT_KEY = 'INIT'

function activate(context){
  let worker = {}
  
  const initNiketa = (mode) => () => {
    worker = initExtension(mode)
    if(getter(INIT_KEY)) return

    setter(INIT_KEY, true)
    worker.initStatusBars()
    worker.init()
  }

  const startAutoModeCommand = vscode.commands.registerCommand(START_AUTO_MODE, initNiketa('auto.jest'))
  const requestCancelationCommand = vscode.commands.registerCommand(REQUEST_CANCELATION,
    () => worker.requestCancelation())
  const lintFileCommand = vscode.commands.registerCommand(REQUEST_LINT_FILE,
    () => {
      if(worker.requestLintFile) return worker.requestLintFile()

      initNiketa('default')()
      delay(1000).then(() => worker.requestLintFile())
    })

  const requestTestRunCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN,
    () => {
      if(worker.requestTestRun) return worker.requestTestRun()

      initNiketa('default')()
      delay(1000).then(() => worker.requestTestRun())
    })

  context.subscriptions.push(startAutoModeCommand)
  context.subscriptions.push(requestCancelationCommand)
  context.subscriptions.push(lintFileCommand)
  context.subscriptions.push(requestTestRunCommand)
}

exports.activate = activate
