import {existsSync} from 'fs'
import {log} from 'helpers-fn'
import {lintFn} from 'lint-fn'

function checkShouldContinue(result: any, label: string, debug?: boolean) {
  if (debug) console.log(result, label)
  if (!result) {
    return true
  }

  log(`File is linted`, 'box')
  log('sep')
  return false
}

export async function applyLint(input: {
  fileName: string,
  debug?: boolean,
  altLintMode: boolean,
}) {
  if (!existsSync(input.fileName))
    return log(`${input.fileName} is deleted`, 'error')

  log('sep')
  log(`will lint ${input.fileName}`, 'info')
  log('sep')

  const baseProps = {
    filePath: input.fileName,
    debug: input.debug,
    useAlternativeExecCommand: input.altLintMode,
  }

  const initialLintResult = await lintFn(baseProps)
  if (!checkShouldContinue(initialLintResult, 'initial', input.debug)) return

  const lintResultWithOuter = await lintFn({
    ...baseProps,
    prettierSpecialCase: 'outer',
  })
  if (!checkShouldContinue(lintResultWithOuter, 'outer', input.debug)) return
  const lintResultWithLocal = await lintFn({
    ...baseProps,
    prettierSpecialCase: 'local',
    forceTypescript: true,
  })
  if (!checkShouldContinue(lintResultWithLocal, 'local', input.debug)) return
  log(`File failed to be linted`, 'box')
}
