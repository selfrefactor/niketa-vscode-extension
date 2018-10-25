const vscode = require('vscode')
const { DEFAULT_COMMAND } = require('./constants')
const bar = require('./bar')
const { init } = require('./steps/init')
const {once} = require('rambdax')

const startFn = once(() => {
  bar.init()
  init()
})

function activate(context) {
  const start = vscode.commands.registerCommand(
    DEFAULT_COMMAND,
    () => startFn()
  )

  context.subscriptions.push(start)
}

exports.activate = activate
