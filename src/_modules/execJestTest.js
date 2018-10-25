const {
  JEST_BIN,
  NUM_FAILED,
  NUM_PASSED,
  SUCCESS_ICON,
  ERROR_ICON,
  TOOLTIP_LIMIT,
} = require('../constants')
const {
  startSpinner,
  stopSpinner,
  show,
  tooltip,
} = require('../bar')
const { delay, take, multiline } = require('rambdax')
const { numbersTransform } = require('helpers')

const vscode = require('vscode')
const { execJest } = require('./execJest')

const NODE = vscode.workspace.getConfiguration('autoJest').get('nodePath')

async function execJestTest(holder) {
  try {
    const testPattern = `-- ${ holder.specFile }`
    const options = '--json --collectCoverage=false'

    const command = multiline(`
      ${ NODE }
      ${ JEST_BIN }
      ${ options }
      ${ holder.hasReact ? '' : '--env=node' }
      ${ testPattern }
    `)

    startSpinner()

    const execResult = await execJest(
      command,
      { cwd : holder.dir }
    )

    stopSpinner()
    await delay(200)

    if (!execResult.stdout.includes(NUM_FAILED)) return

    const result = JSON.parse(execResult.stdout)
    const numPassed = result[ NUM_PASSED ]
    const numFailed = result[ NUM_FAILED ]

    const successMessage = {
      num  : numPassed,
      icon : SUCCESS_ICON,
    }
    const errorMessage = {
      num  : numFailed,
      icon : ERROR_ICON,
    }

    const _ = numFailed === 0 ?
      successMessage :
      errorMessage

    const numbers = numbersTransform(_.num, true)
    show(`${ _.icon }${ numbers }${ _.icon }`)
    tooltip(
      take(TOOLTIP_LIMIT, execResult.stderr.toString())
    )
  } catch (error) {
    throw error
  }
}

exports.execJestTest = execJestTest
