const vscode = require('vscode')
const { initExtension } = require('./worker')
const { getter, setter } = require('rambdax')
const { START, REQUEST_CANCELATION, REQUEST_TEST_RUN, REQUEST_LINT_FILE, TOGGLE_FORCE_LINT_MODE} = require('./constants')

const INIT_KEY = 'INIT'

function activate(context){
  const worker = initExtension()
  const initNiketa = () => {
    if(getter(INIT_KEY)){
      if(worker.isLocked()){
        return worker.unlock()
      }
      return worker.stop()
    } 
    setter(INIT_KEY, true)
    worker.initStatusBars()
    worker.init()
  }

  const startCommand = vscode.commands.registerCommand(START, initNiketa)
  const requestCancelationCommand = vscode.commands.registerCommand(REQUEST_CANCELATION,
    () => worker.requestCancelation())
  const lintFileCommand = vscode.commands.registerCommand(REQUEST_LINT_FILE,
    () => worker.requestLintFile())
  const disableEnableCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN,
    () => worker.requestTestRun())
  const toggleForceLintModeCommand = vscode.commands.registerCommand(TOGGLE_FORCE_LINT_MODE,
    () => worker.toggleForceLintMode())

  context.subscriptions.push(startCommand)
  context.subscriptions.push(toggleForceLintModeCommand)
  context.subscriptions.push(requestCancelationCommand)
  context.subscriptions.push(lintFileCommand)
  context.subscriptions.push(disableEnableCommand)
}

exports.activate = activate
