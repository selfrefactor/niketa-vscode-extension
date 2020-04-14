import { head } from 'rambdax'

import { cleanFail } from './cleanFail'
import { cleanStdout } from './cleanStdout'

export function clean(
  execResult, pass, uncoveredLines
){
  const stderr = pass ?
    head(execResult.stderr.toString().split('PASS')) :
    cleanFail(execResult.stderr.toString())

  const stdout = cleanStdout(execResult.stdout.toString())

  const uncovered = uncoveredLines ?
    `\nUncovered lines : ${ uncoveredLines }` :
    ''

  return {
    stderr,
    stdout,
    uncovered,
  }
}
