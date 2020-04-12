const vscode = require('vscode')
const { changeMode } = require('./_modules/changeMode')
const { initExtension } = require('./worker')
const { MODES, START, START_DEMO, CHANGE_MODE } = require('./constants')
const { setter, getter, head } = require('rambdax')

setter('ACTIVE_FLAG', false)
setter('ACTIVATED', false)
setter('MODE', head(MODES))

function activate(context){
  const fn = () => {
    if (!getter('ACTIVATED')){
      setter('ACTIVATED', true)
      const worker = initExtension()
      worker.initStatusBars()
    }
  }
  const startCommand = vscode.commands.registerCommand(START, fn)

  const changeModeCommand = vscode.commands.registerCommand(CHANGE_MODE,
    changeMode)

  context.subscriptions.push(startCommand)
  context.subscriptions.push(changeModeCommand)
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
