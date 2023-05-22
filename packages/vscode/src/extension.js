const vscode = require('vscode')
const { initExtension } = require('./worker')
const { getter, setter, delay } = require('rambdax')
const { REQUEST_TEST_RUN, REQUEST_LINT_FILE} = require('./constants')

const INIT_KEY = 'INIT'

function activate(context){
  let worker = {}
  
  const initNiketa = () => () => {
    worker = initExtension()
    if(getter(INIT_KEY)) return

    setter(INIT_KEY, true)
    worker.initStatusBars()
    worker.init()
  }
  // let translateWithChatGpt = () => {
  // }

  const lintFileCommand = vscode.commands.registerCommand(REQUEST_LINT_FILE,
    () => {
      if(worker.requestLintFile) return worker.requestLintFile()

      initNiketa()()
      delay(1000).then(() => worker.requestLintFile())
    })

  const requestTestRunCommand = vscode.commands.registerCommand(REQUEST_TEST_RUN,
    () => {
      if(worker.requestTestRun) return worker.requestTestRun()

      initNiketa()()
      delay(1000).then(() => worker.requestTestRun())
    })

  //   let translateWithChatGptCommand = vscode.commands.registerCommand(CHAT_GPT_TRANSLATE, translateWithChatGpt)

  context.subscriptions.push(lintFileCommand)
  context.subscriptions.push(requestTestRunCommand)
  // context.subscriptions.push(translateWithChatGptCommand)
}

exports.activate = activate
