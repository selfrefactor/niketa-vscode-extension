const {initStatusBar} = require('./status-bar')
const vscode = require('vscode')
const { changeMode } = require('./_modules/changeMode')
const { init } = require('./steps/init')
const { initEmitter } = require('./_modules/emitter')
const { initDecorate } = require('./decorator/decorator.js')
const { startSocketClient } = require('./socket-client/socket-client.js')
const { startClient } = require('./client')
const { MODES, START,START_DEMO, CHANGE_MODE } = require('./constants')
const { setter, getter, delay, head } = require('rambdax')

setter('ACTIVE_FLAG', false)
setter('ACTIVATED', false)
setter('MODE', head(MODES))

function activate(context){


  const fn = () => {
    if (!getter('ACTIVATED')){
      initStatusBar()
      setter('ACTIVATED', true)
      startSocketClient()
      // initDecorate()
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
