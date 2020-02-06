import { log, startLoadingBar, stopLoadingBar } from 'helpers'
import { glue } from 'rambdax'

import { execJest } from './_modules/execJest'
import { getCoveragePath } from './_modules/getCoveragePath'
import { getSpecFile } from './_modules/getSpecFile'
import { whenFileLoseFocus } from './_modules/whenFileLoseFocus'
import { coverageMode } from './coverageMode'
import { startSpinner } from './emitters/startSpinner'
import { stopSpinner } from './emitters/stopSpinner'
import { lintMode } from './lintMode'
import { proveMode } from './proveMode.js'

const ALLOW_RESULT_LOG = false
const JEST_BIN = './node_modules/jest/bin/jest.js'

const isProveMode = filePath => filePath.toLowerCase().endsWith('prove.js')

let fileHolder
let lintFileHolder
let specFileHolder

// Dispatch between all possible modes
// ============================================
export async function fileSaved({
  debugFlag,
  lintOnly,
  disableLint,
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
  const maybeLog = (...logInputs) => {
    if (!debugFlag) return
    if (logInputs[ 0 ] === 'Result'){
      return ALLOW_RESULT_LOG ? console.log(...logInputs) : null
    }
    console.log(...logInputs)
  }

  if (filePath !== lintFileHolder && lintFileHolder !== undefined){
    log(`LINT ${ lintFileHolder }`, 'box')
    whenFileLoseFocus(lintFileHolder, disableLint)
    lintFileHolder = filePath
  } else {
    log(`SKIP_LINT ${ lintFileHolder }`, 'box')
  }

  const startLoaders = () => {
    startSpinner(emit)
    startLoadingBar({
      symbol : '💗',
      step   : 500,
    })
  }
  const stopLoaders = () => {
    stopSpinner(emit)
    stopLoadingBar()
  }

  if (isProveMode(filePath)){
    lintFileHolder = filePath

    return proveMode({
      maybeLog,
      stopLoaders,
      startLoaders,
      notify,
      notifyClose,
      filePath,
      dir,
      emit,
    })
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
    return maybeLog(filePath, 'no specfile')
  }

  if (!fileHolder.startsWith(dir)){
    // when we have filepath from previous project but not in the current
    ///////////////////
    return maybeLog('still waiting for testable file in this project', dir)
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

  startLoaders()
  maybeLog('Start', command)

  /*
    TODO: it needs a max ms for execution of the test
  */
  const execResult = await execJest(command, { cwd : dir })
  maybeLog('End', command)
  maybeLog('Result', execResult)

  stopLoaders()

  process.stderr.write(execResult.stderr)
  process.stderr.write(execResult.stdout)

  await coverageMode({
    emit,
    execResult,
    fileName,
    filePath : fileHolder,
    maybeSpecFile,
    notify,
    notifyClose,
  })
}
