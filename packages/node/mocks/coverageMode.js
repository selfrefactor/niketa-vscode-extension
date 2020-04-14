import { ok, take } from 'rambdax'

import { clean } from './_modules/clean'
import { parseCoverage } from './_modules/parseCoverage'
import { additional } from './emitters/additional'
import { show } from './emitters/show'
import { tooltip } from './emitters/tooltip'

export const ERROR_ICON = '❌'
export const SUCCESS_ICON = '🐬'
const NO_COVERAGE = 'LINE === undefined'

export function coverageMode({ emit, execResult, fileName, filePath }){
  const hasError =
    execResult.stderr.startsWith('FAIL') ||
    execResult.stderr.includes('ERROR:')

  if (hasError){
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

  if (message === NO_COVERAGE){
    additional(emit)

    return show(emit, SUCCESS_ICON)
  }

  show(emit, pass ? message : ERROR_ICON)
  const cleaner = clean(
    execResult, pass, uncovered
  )

  if (cleaner.stdout.trim() === '') return

  tooltip(emit, `${ cleaner.stderr }${ cleaner.stdout }${ cleaner.uncovered }`)
  additional(emit, uncovered)
}

/*
  function cleanStdout(execResult){
  if (!execResult.stdout.includes('console.log')) return ''

  const [ first ] = execResult.stdout.split('----------')

  return first
    .split('\n')
    .filter(x => x && !x.includes('console.log'))
    .join('\n')
}
*/
