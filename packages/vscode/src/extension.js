const vscode = require('vscode')
const { initExtension } = require('./worker')
const { START, REQUEST_CANCELATION, DISABLE_ENABLE } = require('./constants')

function activate(context){
  const worker = initExtension()
  const fn = () => {
    worker.initStatusBars()
    worker.init()
  }

  const startCommand = vscode.commands.registerCommand(START, fn)
  const requestCancelationCommand = vscode.commands.registerCommand(REQUEST_CANCELATION,
    () => worker.requestCancelation())
  const disableEnableCommand = vscode.commands.registerCommand(DISABLE_ENABLE,
    () => worker.disableEnable())

  context.subscriptions.push(startCommand)
  context.subscriptions.push(requestCancelationCommand)
  context.subscriptions.push(disableEnableCommand)
}

exports.activate = activate
