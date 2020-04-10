const bar = require('./status-bar')
const vscode = require('vscode')
const { changeMode } = require('./_modules/changeMode')
const { init } = require('./steps/init')
const { initEmitter } = require('./_modules/emitter')
const { MODES, START,START_DEMO, CHANGE_MODE } = require('./constants')
const { setter, getter, delay, head } = require('rambdax')

setter('ACTIVE_FLAG', false)
setter('ACTIVATED', false)
setter('MODE', head(MODES))

function activate(context){
  const startCommand = vscode.commands.registerCommand(START, () => {
    if (!getter('ACTIVATED')){
      setter('ACTIVATED', true)

      bar.init()
      initEmitter()

      delay(1000).then(() => init())
    }

    setter('ACTIVE_FLAG', !getter('ACTIVE_FLAG'))
  })
  const startDemoCommand = vscode.commands.registerCommand(START_DEMO, () => {
    if (!getter('ACTIVATED')){
      setter('ACTIVATED', true)

      bar.init()
      initEmitter()

      delay(1000).then(() => init())
    }

    setter('ACTIVE_FLAG', !getter('ACTIVE_FLAG'))
  })

  const changeModeCommand = vscode.commands.registerCommand(CHANGE_MODE,
    changeMode)

  context.subscriptions.push(startCommand)
  context.subscriptions.push(startDemoCommand)
  context.subscriptions.push(changeModeCommand)
}

exports.activate = activate
