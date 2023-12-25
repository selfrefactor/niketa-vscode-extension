const vscode = require('vscode')
const {
  FIRST,
  SECOND,
} = require('./constants')
const { delay, getter, setter } = require('rambdax')
const { initExtension } = require('./worker')

const INIT_KEY = 'INIT'

function activate(context){
  let worker = {}

  const initNiketa = () => () => {
    worker = initExtension()
    if (getter(INIT_KEY)) return

    setter(INIT_KEY, true)
    worker.init()
  }

  const firstCommand = vscode.commands.registerCommand(FIRST,
    () => {
      if (worker.requestRun) return worker.requestRun({index: 0})

      initNiketa()()
      delay(1000).then(() => worker.requestRun({index: 0}))
    })

  const secondCommand = vscode.commands.registerCommand(SECOND,
    () => {
      if (worker.requestRun) return worker.requestRun({index: 1})

      initNiketa()()
      delay(1000).then(() => worker.requestRun({index: 1}))
    })


  context.subscriptions.push(firstCommand)
  context.subscriptions.push(secondCommand)
}

exports.activate = activate
