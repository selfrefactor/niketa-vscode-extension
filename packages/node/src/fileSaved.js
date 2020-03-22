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
import { prettyHtmlMode as prettyHtmlModeMethod } from './prettyHtmlMode.js'
import { proveMode } from './proveMode.js'
import { stylelintMode as stylelintModeMethod } from './stylelintMode.js'

const JEST_BIN = './node_modules/jest/bin/jest.js'

const isProveMode = filePath => filePath.toLowerCase().endsWith('prove.js')

let fileHolder
let lintFileHolder
let specFileHolder

export async function fileSaved({
  dir,
  disableLint,
  emit,
  filePath,
  hasReact,
  hasWallaby,
  lintOnly,
  notify,
  notifyClose,
  prettyHtmlMode,
  stylelintMode,
}){
  if (prettyHtmlMode) return prettyHtmlModeMethod(filePath)
  if (stylelintMode) return stylelintModeMethod(filePath)
  const allowLint =
    filePath !== lintFileHolder && lintFileHolder !== undefined

  const proveModeEligible = isProveMode(filePath)

  if (allowLint){
    log(`LINT ${ lintFileHolder }`, 'box')
    await whenFileLoseFocus(lintFileHolder, disableLint)
    lintFileHolder = filePath
  } else {
    log(`SKIP_LINT ${ lintFileHolder }`, 'box')
  }

  if ((lintOnly || hasWallaby) && !proveModeEligible) return

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

  if (proveModeEligible){
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

  if (maybeSpecFile){
    fileHolder = filePath
    lintFileHolder = filePath
    specFileHolder = maybeSpecFile
    debugLog(filePath, 'saved for lint later')
  } else {
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

  if (execResult.takesTooLong){
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
