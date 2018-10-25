const vscode = require('vscode')
const { DEFAULT_COMMAND } = require('./constants')
const bar = require('./bar')
const { init } = require('./steps/init')
const {setter, getter} = require('./_helpers/internalData')
const {INIT_FLAG, ACTIVE_FLAG} = require('./keys')

setter(INIT_FLAG, false)
setter(ACTIVE_FLAG, false)

function activate(context) {
  bar.init()

  const start = vscode.commands.registerCommand(
    DEFAULT_COMMAND,
    () => {
      if(!getter(INIT_FLAG)){
        setter(INIT_FLAG, true)
        init()
      }

      setter(ACTIVE_FLAG,!getter(ACTIVE_FLAG))
    }
  )

  context.subscriptions.push(start)
}

exports.activate = activate
