import { allTrue, getter, ok, take } from 'rambdax'

import { clean } from './_modules/clean'
import { parseCoverage } from './_modules/parseCoverage'
import { shouldNotify } from './_modules/shouldNotify'
import { takeNotifyWhenError } from './ants/takeNotifyWhenError'

import { additional } from './emitters/additional'
import { show } from './emitters/show'
import { tooltip } from './emitters/tooltip'

export const ERROR_ICON = '❌'
export const SUCCESS_ICON = '🐬'
const ERROR_CONDITION = 'LINE === undefined'

function cleanStdout(execResult){
  if (!execResult.stdout.includes('console.log')) return ''

  const [ first ] = execResult.stdout.split('----------')

  return first.split('\n').filter(x => x && !x.includes('console.log'))
    .join('\n')
}

// Run coverage and send to `niketa-notify` and VSCode
// ============================================
export function coverageMode({
  emit,
  execResult,
  fileName,
  filePath,
  maybeSpecFile,
  notify,
  notifyClose,
}){
  const electronConnected = Boolean(getter('electron.connected'))

  if (
    execResult.stderr.startsWith('FAIL') ||
      execResult.stderr.includes('ERROR:')
  ){
    const notifyWhenError = takeNotifyWhenError(execResult)
    if (notifyWhenError && Boolean(notify) && Boolean(notifyClose)){
      notify(notifyWhenError)
      notifyClose()
    }

    tooltip(emit, take(800, execResult.stderr))
    additional(emit)

    return show(emit, ERROR_ICON)
  }

  const { pass, message, uncovered } = parseCoverage(
    execResult,
    fileName,
    filePath
  )
  ok(message)('string')

  if (message === ERROR_CONDITION){
    const toNotify = cleanStdout(execResult)
    if (toNotify && electronConnected){
      notify(toNotify)
      notifyClose()
    }
    additional(emit)

    return show(emit, SUCCESS_ICON)
  }

  show(emit, pass ? message : ERROR_ICON)
  const cleaner = clean(execResult, pass, uncovered)

  if (cleaner.stdout.trim() === '') return

  const okNotify = allTrue(
    shouldNotify(maybeSpecFile),
    cleaner.stdout.includes('console.log'),
    electronConnected
  )

  if (okNotify){
    notify(cleaner.stdout)
    notifyClose()
  }

  tooltip(emit, `${ cleaner.stderr }${ cleaner.stdout }${ cleaner.uncovered }`)
  additional(emit, uncovered)
}
