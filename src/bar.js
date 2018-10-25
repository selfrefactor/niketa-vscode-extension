const vscode = require('vscode')
const { DEFAULT_COMMAND, NAME } = require('./constants')
const { loadingBar } = require('helpers')
const { getConfig } = require('./_helpers/getConfig')

const lintFlag = getConfig('lintFlag')
const dummy = {text: '', show: () => {}, tooltip: () =>{}}
const BAR_LENGTH = 3
const PRIORITY = 100

const bar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  PRIORITY
)

const lintBar = lintFlag ? 
  (
    vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      PRIORITY - 1
    )
  ) :
  dummy

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
  lintBar.text = '🇧🇬'
}

const getBar = () => bar
const show = x => bar.text = x
const tooltip = x => bar.tooltip = x

/**
 * Pass tooltip and text
 */
const lintBarFn = input => {
  if (input.tooltip){
    lintBar.tooltip = input.tooltip
  }
  lintBar.text = input.text
}

exports.lintBar = lintBarFn

exports.getBar = getBar
exports.init = init

exports.show = show
exports.tooltip = tooltip

exports.startSpinner = startSpinner
exports.stopSpinner = stopSpinner
