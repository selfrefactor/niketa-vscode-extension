const vscode = require("vscode")
const { LINT_RUN, SCRIPT_RUN, CYCLE_SCRIPT } = require("./constants")
const { initExtension } = require("./worker")

function activate(context) {
  let worker = {}
  let initPromise = null

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    50
  )

  const updateStatusBar = () => {
    if (worker.hasMultipleScripts && worker.currentScriptName) {
      statusBarItem.text = `$(tools) ${worker.currentScriptName}`
      statusBarItem.tooltip = `Click to switch Niketa script`
      statusBarItem.command = CYCLE_SCRIPT
      statusBarItem.show()
    } else {
      statusBarItem.hide()
    }
  }

  const initNiketa = async () => {
    if (initPromise) return initPromise

    initPromise = (async () => {
      worker = initExtension()
      await worker.init()
      updateStatusBar()
    })()

    return initPromise
  }

  const cycleScriptCommand = vscode.commands.registerCommand(
    CYCLE_SCRIPT,
    async () => {
      await worker.cycleActiveScript()
      updateStatusBar()
    }
  )

  const lintCommand = vscode.commands.registerCommand(LINT_RUN, async () => {
    if (!worker.initialized) {
      await initNiketa()
    }
    worker.standaloneLint()
  })

  const scriptRunCommand = vscode.commands.registerCommand(SCRIPT_RUN, async () => {
    if (!worker.initialized) {
      await initNiketa()
    }
    worker.requestRun()
  })

  // Keep old command ID as an alias for backward compatibility
  const legacyTestRunCommand = vscode.commands.registerCommand('niketa.request.run.test', async () => {
    if (!worker.initialized) {
      await initNiketa()
    }
    worker.requestRun()
  })

  context.subscriptions.push(cycleScriptCommand)
  context.subscriptions.push(lintCommand)
  context.subscriptions.push(scriptRunCommand)
  context.subscriptions.push(legacyTestRunCommand)
  context.subscriptions.push(statusBarItem)

  // Eagerly init so status bar appears on activation (if workspace is open)
  if (
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    initNiketa()
  }
}

exports.activate = activate
