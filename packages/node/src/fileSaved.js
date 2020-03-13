import { log, startLoadingBar, stopLoadingBar } from 'helpers'
import { glue } from 'rambdax'

import { debugLog } from './_helpers/debugLog'
import { execJest } from './_modules/execJest'
import { getCoveragePath } from './_modules/getCoveragePath'
import { getSpecFile } from './_modules/getSpecFile'
import { whenFileLoseFocus } from './_modules/whenFileLoseFocus'
import { coverageMode } from './coverageMode'
import { startSpinner } from './emitters/startSpinner'
import { stopSpinner } from './emitters/stopSpinner'
import { lintMode } from './lintMode'
import { prettyHtmlMode as prettyHtmlModeMethod } from './prettyHtmlMode.js'
import { proveMode } from './proveMode.js'

const JEST_BIN = './node_modules/jest/bin/jest.js'

const isProveMode = filePath => filePath.toLowerCase().endsWith('prove.js')

let fileHolder
let lintFileHolder
let specFileHolder

// Dispatch between all possible modes
// ============================================
export async function fileSaved({
  lintOnly,
  disableLint,
  dir,
  emit,
  filePath,
  hasReact,
  prettyHtmlMode,
  hasWallaby,
  notify,
  notifyClose,
}){
  if (prettyHtmlMode){
    return prettyHtmlModeMethod(filePath)
  }

  if (lintOnly || hasWallaby){
    return lintMode({
      notify,
      notifyClose,
      filePath,
      okLint : true,
    })
  }

  const allowLint = filePath !== lintFileHolder && lintFileHolder !== undefined

  if (allowLint){
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
    filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.ts')

  if (maybeSpecFile){
    fileHolder = filePath
    lintFileHolder = filePath
    specFileHolder = maybeSpecFile
    debugLog(filePath, 'saved for lint later')
  } else if (canStillLint){
    debugLog(filePath, 'saved for lint later even without spec')

    // Even if the file has no corresponding spec file
    // we keep it for further linting
    ///////////////////////////
    lintFileHolder = filePath
  }

  if (!(fileHolder && specFileHolder)){
    // This happens only until the script receives a correct filepath
    ///////////////////
    return debugLog('no specfile', filePath)
  }

  if (!fileHolder.startsWith(dir)){
    // when we have filepath from previous project but not in the current
    ///////////////////
    return debugLog(dir, 'still waiting for testable file in this project')
  }

  const specFile = maybeSpecFile ? maybeSpecFile : specFileHolder

  const testPattern = `-- ${ specFile }`
  const [ coveragePath, fileName ] = getCoveragePath(dir, fileHolder)

  const command = glue(`
    ${ JEST_BIN }
    '-u'
    --maxWorkers=1
    ${ hasReact ? '' : '--env=node' }
    --collectCoverage=true
    ${ coveragePath }
    ${ testPattern }
  `)

  startLoaders()
  
  const execResult = await execJest(command, { cwd : dir })
  debugLog(command, 'command end')
  debugLog(execResult, 'jest result')

  stopLoaders()

  if(execResult.takesTooLong){
    log(command, 'box')
    return log('TAKES TOO LONG', 'error')
  }

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
