const vscode = require('vscode')
const { initExtension } = require('./worker')
const { getter, setter } = require('rambdax')
const { START, REQUEST_CANCELATION, REQUEST_TEST_RUN, REQUEST_LINT_FILE, START_AUTO_MODE} = require('./constants')

const INIT_KEY = 'INIT'

const emptyWorker = {
  requestLintFile: () => {},
  requestTestRun: () => {},
}

function activate(context){
  let worker = emptyWorker
  
  const initNiketa = (mode) => () => {
    worker = initExtension(mode)
    if(getter(INIT_KEY)) return

    setter(INIT_KEY, true)
    worker.initStatusBars()
    worker.init()
  }

  const startCommand = vscode.commands.registerCommand(START, initNiketa('default'))
  const startAutoModeCommand = vscode.commands.registerCommand(START_AUTO_MODE, initNiketa('auto.jest'))
  const requestCancelationCommand = vscode.commands.registerCommand(REQUEST_CANCELATION,
    () => worker.requestCancelation())
  const lintFileCommand = vscode.commands.registerCommand(REQUEST_LINT_FILE,
    () => worker.requestLintFile())
  const requestTestRunCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN,
    () => worker.requestTestRun())

  context.subscriptions.push(startCommand)
  context.subscriptions.push(startAutoModeCommand)
  context.subscriptions.push(requestCancelationCommand)
  context.subscriptions.push(lintFileCommand)
  context.subscriptions.push(requestTestRunCommand)
}

exports.activate = activate
