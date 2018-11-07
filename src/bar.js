const vscode = require('vscode')
const { CHANGE_MODE } = require('./constants')
const { loadingBar } = require('./_modules/loadingBar')
const { delay } = require('rambdax')
const {config} = require('./config')

const dummy = {
  text: '', 
  show: () => {},
  tooltip: () =>{}
}

const BAR_LENGTH = 3
const PRIORITY = 100

const holder = {}

holder.bar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  PRIORITY
)

holder.secondBar = config.secondBar.enabled ? 
  (
    vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      PRIORITY -1
    )
  ) :
  dummy

holder.thirdBar = config.thirdBar.enabled ? 
  (
    vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      PRIORITY -2
    )
  ) :
  dummy

holder.bar.command = CHANGE_MODE
let intervalHolder

const startSpinner = () => {
  const loadingBarFn = loadingBar(BAR_LENGTH)
  intervalHolder = setInterval(() => {
    holder.bar.text = loadingBarFn()
  }, 333)
}

const stopSpinner = () => {
  clearInterval(intervalHolder)
}

const init = () => {
  const bars = ['bar','secondBar', 'thirdBar']
  
  bars.forEach( x => {
    holder[x].show()
    holder[x].text = config[x].text
    holder[x].tooltip = config[x].tooltip
    
    delay(config[x].closeAfter)
      .then(() => holder[x].text = config[x].afterText)
  })
}

const getBar = () => holder.bar
const show = x => holder.bar.text = x
const tooltip = x => holder.bar.tooltip = x

/**
 * Pass tooltip and text
 */
const emitToBar = input => {
  if (input.tooltip){
    holder[input.name].tooltip = input.tooltip
  }
  holder[input.name].text = input.text

  if(input.afterText !== undefined){
    delay(4000)
      .then(() => holder[input.name].text = input.afterText)
  }
}


exports.getBar = getBar
exports.init = init

exports.emitToBar = emitToBar
exports.show = show
exports.tooltip = tooltip

exports.startSpinner = startSpinner
exports.stopSpinner = stopSpinner
