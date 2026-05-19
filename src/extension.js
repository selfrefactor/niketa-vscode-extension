const vscode = require("vscode")
const { LINT_RUN, TEST_RUN } = require("./constants")
const { delay, getter, setter } = require("rambdax")
const { initExtension } = require("./worker")

const INIT_KEY = "INIT"

function activate(context) {
  let worker = {}

  const initNiketa = async () => {
    worker = initExtension()
    if (getter(INIT_KEY)) {
      return
    }

    setter(INIT_KEY, true)
    await worker.init()
  }

  const lintCommand = vscode.commands.registerCommand(LINT_RUN, async () => {
    if (!worker.initialized) {
      await initNiketa()
    }
    worker.standaloneLint()
  })

  const testRunCommand = vscode.commands.registerCommand(TEST_RUN, async () => {
    if (!worker.initialized) {
      await initNiketa()
    }
    worker.requestRun()
  })
  context.subscriptions.push(lintCommand)
  context.subscriptions.push(testRunCommand)
}

exports.activate = activate
