const vscode = require('vscode')
const {
  LINT_RUN,
  TEST_RUN,
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

  const lintCommand = vscode.commands.registerCommand(LINT_RUN,
    () => {
      if (worker.initialized) return worker.biomeLint()

      initNiketa()()
      delay(1000).then(() => worker.biomeLint())
    })

  const testRunCommand = vscode.commands.registerCommand(TEST_RUN,
    () => {
      if (worker.initialized) return worker.requestRun()

      initNiketa()()
      delay(1000).then(() => worker.requestRun())
    })


  context.subscriptions.push(lintCommand)
  context.subscriptions.push(testRunCommand)
}

exports.activate = activate
