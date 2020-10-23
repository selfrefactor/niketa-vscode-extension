const vscode = require('vscode')
const { initExtension } = require('./worker')
const { getter, setter } = require('rambdax')
const { START, REQUEST_CANCELATION, REQUEST_TEST_RUN } = require('./constants')

const INIT_KEY = 'INIT'

function activate(context){
  if(getter(INIT_KEY)) return
  
  setter(INIT_KEY, true)
  const worker = initExtension()
  const fn = () => {
    worker.initStatusBars()
    worker.init()
  }

  const startCommand = vscode.commands.registerCommand(START, fn)
  const requestCancelationCommand = vscode.commands.registerCommand(REQUEST_CANCELATION,
    () => worker.requestCancelation())
  const disableEnableCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN,
    () => worker.requestTestRun())

  context.subscriptions.push(startCommand)
  context.subscriptions.push(requestCancelationCommand)
  context.subscriptions.push(disableEnableCommand)
}

exports.activate = activate
