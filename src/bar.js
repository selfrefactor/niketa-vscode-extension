const vscode = require('vscode')
const { DEFAULT_COMMAND, NAME } = require('./constants')
const { loadingBar } = require('helpers')

const BAR_LENGTH = 3
const PRIORITY = 100
const bar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  PRIORITY
)
const lintBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  PRIORITY - 1
)
bar.command = DEFAULT_COMMAND
let intervalHolder

const startSpinner = () => {
  const loadingBarFn = loadingBar(BAR_LENGTH)
  intervalHolder = setInterval(() => {
    bar.text = loadingBarFn()
  }, 333)
}

const stopSpinner = () => {
  clearInterval(intervalHolder)
}

const init = () => {
  bar.show()
  lintBar.show()
  bar.text = `${ NAME }_WAITING`
  bar.text = '🇧🇬'
}

const getBar = () => bar
const getLoadingBar = () => loadingBarFn(BAR_LENGTH)
const show = x => bar.text = x
const tooltip = x => bar.tooltip = x

const lintBarFn = input => {
  if (input.tooltip){
    lintBar.tooltip = input.tooltip
  }
  lintBar.text = input.text
}

exports.lintBar = lintBarFn
exports.getBar = getBar
exports.getLoadingBar = getLoadingBar
exports.init = init
exports.show = show
exports.startSpinner = startSpinner
exports.stopSpinner = stopSpinner
exports.tooltip = tooltip
