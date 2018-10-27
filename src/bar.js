const vscode = require('vscode')
const { DEFAULT_COMMAND, NAME } = require('./constants')
const { loadingBar } = require('helpers')
const { delay, ok, mapFastAsync } = require('rambdax')
const {config} = require('../config')
const { getConfig } = require('./_helpers/getConfig')

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
      PRIORITY +1
    )
  ) :
  dummy

holder.thirdBar = config.thirdBar.enabled ? 
  (
    vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      PRIORITY +2
    )
  ) :
  dummy

holder.bar.command = DEFAULT_COMMAND
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

const init = async () => {
  await mapFastAsync(
    async x => {
      holder[x].show()
      holder[x].text = config[x].text
      holder[x].tooltip = config[x].tooltip
      
      await delay(config[x].closeAfter)
      
      holder[x].text = ''
    }
  )(['bar','secondBar', 'thirdBar'])
}

const getBar = () => holder.bar
const show = x => holder.bar.text = x
const tooltip = x => holder.bar.tooltip = x

/**
 * Pass tooltip and text
 */
const emitToBar = input => {
  ok(input)({name:'string', text:'string'})

  if (input.tooltip){
    holder[input.name].tooltip = input.tooltip
  }
  holder[input.name].text = input.text
}

exports.emitToBar = emitToBar

exports.getBar = getBar
exports.init = init

exports.show = show
exports.tooltip = tooltip

exports.startSpinner = startSpinner
exports.stopSpinner = stopSpinner
