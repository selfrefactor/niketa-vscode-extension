const vscode = require('vscode')
const {delay} = require('rambdax')
const { DEFAULT_COMMAND } = require('./constants')
const bar = require('./bar')
const { init } = require('./steps/init')
const {setter, getter} = require('./_helpers/internalData')
const {initEmitter, emit} = require('./_modules/emitter')
const {INIT_FLAG, ACTIVE_FLAG} = require('./keys')

setter(INIT_FLAG, false)
setter(ACTIVE_FLAG, true)

function activate(context) {
  bar.init()
  initEmitter()
  delay(2000).then(()=>{
    init()
  })

  const start = vscode.commands.registerCommand(
    DEFAULT_COMMAND,
    () => {
      if(!getter(INIT_FLAG)){
        setter(INIT_FLAG, true)
        // init()
      }

      setter(ACTIVE_FLAG, !getter(ACTIVE_FLAG))
    }
  )

  const changeMode = vscode.commands.registerCommand(
    'niketa.changeMode',
    () => {
      emit({channel: 'changeMode', message:'changeMode'})
    }
  )

  context.subscriptions.push(start)
  context.subscriptions.push(changeMode)
}

exports.activate = activate
