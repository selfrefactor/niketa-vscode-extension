const vscode = require('vscode')
const { initExtension } = require('./worker')
const { setter, getter } = require('rambdax')
const { START, REQUEST_CANCELATION } = require('./constants')

setter('ACTIVE_FLAG', false)
setter('ACTIVATED', false)

function activate(context){
  const worker = initExtension()
  const fn = () => {
    if (!getter('ACTIVATED')){
      setter('ACTIVATED', true)
      worker.initStatusBars()
      worker.init()
    }
  }
  const startCommand = vscode.commands.registerCommand(START, fn)
  const requestCancelationCommand = vscode.commands.registerCommand(REQUEST_CANCELATION,
    worker.requestCancelation)

  context.subscriptions.push(startCommand)
  context.subscriptions.push(requestCancelationCommand)
}

exports.activate = activate
