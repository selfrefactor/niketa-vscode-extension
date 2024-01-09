const vscode = require('vscode')
const {
  FILE_RUN,
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

  const fileRunCommand = vscode.commands.registerCommand(FILE_RUN,
    () => {
      if (worker.requestRun) return worker.requestRun({isTestFile: false})

      initNiketa()()
      delay(1000).then(() => worker.requestRun({isTestFile: false}))
    })

  const testRunCommand = vscode.commands.registerCommand(TEST_RUN,
    () => {
      if (worker.requestRun) return worker.requestRun({isTestFile: true})

      initNiketa()()
      delay(1000).then(() => worker.requestRun({isTestFile: true}))
    })


  context.subscriptions.push(fileRunCommand)
  context.subscriptions.push(testRunCommand)
}

exports.activate = activate
