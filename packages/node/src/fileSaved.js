import { allTrue, getter, glue, ok , take } from 'rambdax'
import { startLoadingBar, stopLoadingBar } from 'helpers'

import { clean } from './_modules/clean'
import { execJest } from './_modules/execJest'
import { getCoveragePath } from './_modules/getCoveragePath'
import { getSpecFile } from './_modules/getSpecFile'
import { parseCoverage } from './_modules/parseCoverage'
import { shouldNotify } from './_modules/shouldNotify'
import { whenFileLoseFocus } from './_modules/whenFileLoseFocus'
import { lintAnt } from './ants/lint'

import { additional } from './emitters/additional'
import { show } from './emitters/show'
import { startSpinner } from './emitters/startSpinner'
import { stopSpinner } from './emitters/stopSpinner'
import { tooltip } from './emitters/tooltip'

const JEST_BIN = './node_modules/jest/bin/jest.js'
const ERROR_ICON = '❌'
const ERROR_CONDITION = 'LINE === undefined'

// Run coverage and send to `niketa-notify` and VSCode
// ============================================
function whenCoverage({
  emit,
  execResult,
  fileName,
  filePath,
  maybeSpecFile,
  notify,
  notifyClose,
}){
  if(execResult.stderr.startsWith('FAIL')){
    show(emit, ERROR_ICON)
    
    return tooltip(emit, take(800,execResult.stderr))
  }

  const { pass, message, uncovered } = parseCoverage(
    execResult,
    fileName,
    filePath
  )
  ok(message)('string')
  if (message === ERROR_CONDITION) return console.log('skip')

  show(emit, pass ? message : ERROR_ICON)
  const cleaner = clean(execResult, pass, uncovered)

  if (cleaner.stdout.trim() === '') return

  const okNotify = allTrue(
    shouldNotify(maybeSpecFile),
    cleaner.stdout.includes('console.log'),
    getter('electron.connected')
  )

  if (okNotify){
    notify(cleaner.stdout)
    notifyClose()
  }
  tooltip(emit, `${ cleaner.stderr }${ cleaner.stdout }${ cleaner.uncovered }`)
  additional(emit, uncovered)
}

// Lint file and send lint output to `niketa-notify`
// ============================================
async function lintMode({ notify, notifyClose, filePath, okLint }){
  if (!okLint) return console.log('!oklint')

  const logResult = await lintAnt(filePath)

  if (logResult && notifyClose){
    notify(logResult)
    notifyClose()
  }
}

let fileHolder
let lintFileHolder
let specFileHolder

// Dispatch between all possible modes
// ============================================
export async function fileSaved({
  lintOnly,
  dir,
  emit,
  filePath,
  hasReact,
  notify,
  notifyClose,
}){
  if (lintOnly){
    return lintMode({
      notify,
      notifyClose,
      filePath,
      okLint : true,
    })
  }

  if (
    filePath !== lintFileHolder &&
    lintFileHolder !== undefined
  ){
    console.log('LINT', lintFileHolder)
    whenFileLoseFocus(lintFileHolder)
    lintFileHolder = filePath
  }

  const maybeSpecFile = getSpecFile(filePath)
  const canStillLint =
    filePath.endsWith('.js') || filePath.endsWith('.jsx')

  if (maybeSpecFile){
    fileHolder = filePath
    lintFileHolder = filePath
    specFileHolder = maybeSpecFile
  } else if (canStillLint){
    // Even if the file has no corresponding spec file
    // we keep it for further linting
    ///////////////////////////
    lintFileHolder = filePath
  }

  if (!(fileHolder && specFileHolder)){
    // This happens only until the script receives a correct filepath
    ///////////////////
    return console.log(filePath, 'no specfile')
  }

  if (!fileHolder.startsWith(dir)){
    // when we have filepath from previous project but not in the current
    ///////////////////
    return console.log('still waiting for testable file in this project')
  }

  const specFile = maybeSpecFile ? maybeSpecFile : specFileHolder

  const testPattern = `-- ${ specFile }`
  const [ coveragePath, fileName ] = getCoveragePath(dir, fileHolder)

  const command = glue(`
    RAMBDAX_LOG=true
    ${ JEST_BIN }
    '-u'
    --maxWorkers=1
    ${ hasReact ? '' : '--env=node' }
    --collectCoverage=true
    ${ coveragePath }
    ${ testPattern }
  `)

  startSpinner(emit)
  startLoadingBar({
    symbol : '💗',
    step   : 500,
  })

  const execResult = await execJest(command, { cwd : dir })

  stopSpinner(emit)
  stopLoadingBar()

  process.stderr.write(execResult.stderr)

  process.stderr.write(execResult.stdout)

  return whenCoverage({
    emit,
    execResult,
    fileName,
    filePath : fileHolder,
    maybeSpecFile,
    notify,
    notifyClose,
  })
}
