const vscode = require('vscode')
const { initExtension } = require('./worker')
const { MODES, START, START_DEMO, REQUEST_CANCELATION } = require('./constants')
const { setter, getter, head } = require('rambdax')

setter('ACTIVE_FLAG', false)
setter('ACTIVATED', false)
setter('MODE', head(MODES))

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

/*
    const startCommand = vscode.commands.registerCommand(START, () => {
    console.log(3)
    if (!getter('ACTIVATED')){
      setter('ACTIVATED', true)

      bar.init()
      initEmitter()

      delay(1000).then(() => init())
    }

    setter('ACTIVE_FLAG', !getter('ACTIVE_FLAG'))
  })
  */
