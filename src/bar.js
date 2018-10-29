const vscode = require('vscode')
const { config } = require('./config')
const { delay, ok } = require('rambdax')

function loadingBar(totalLength){
  let counter = -1
  
  return () => {

    counter = counter === totalLength?
      0 :
      counter + 1
  
    return '🀰'.repeat(counter) + '🀱'.repeat(totalLength - counter)
  }
}

const dummy = {
  text    : '',
  show    : () => {},
  tooltip : () => {},
}

const BAR_LENGTH = 3
const PRIORITY = 100

const holder = {}

holder.bar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  PRIORITY
)

holder.secondBar = config.secondBar.enabled ?

  vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    PRIORITY - 1
  ) :
  dummy

holder.thirdBar = config.thirdBar.enabled ?

  vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    PRIORITY - 2
  ) :
  dummy

holder.bar.command = 'niketa.changeMode'

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

const initFn = x => {
  holder[ x ].show()
  holder[ x ].text = config[ x ].text
  holder[ x ].tooltip = config[ x ].tooltip

  delay(config[ x ].closeAfter).then(() => {
    holder[ x ].text = config[ x ].afterText
  })
}

const init = () => {
  [ 'bar', 'secondBar', 'thirdBar' ].forEach(initFn)
}

const show = x => holder.bar.text = x
const tooltip = x => holder.bar.tooltip = x

/**
 * Pass input.name = 'thirdBar'
 * Pass input.text = 'TEXT'
 * Optianally pass input.tooltip = 'TEXT'
 * Optianally pass input.afterText = 'TEXT'
 */
function emitToBar(input){
  ok(input)({
    name : [ 'bar', 'secondBar', 'thirdBar' ],
    text : 'string',
  })

  if (input.tooltip){
    holder[ input.name ].tooltip = input.tooltip
  }
  holder[ input.name ].text = input.text

  if (input.afterText !== undefined){
    delay(2000).then(() => {
      holder[ input.name ].text = input.afterText
    })
  }
}

exports.init = init
exports.emitToBar = emitToBar
exports.show = show
exports.tooltip = tooltip
exports.startSpinner = startSpinner
exports.stopSpinner = stopSpinner
