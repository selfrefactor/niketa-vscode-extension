import {existsSync} from 'fs'
import {exec, execSafe, log} from 'helpers-fn'
import {lintFn} from 'lint-fn'

function checkShouldContinue(result: any, label: string, debug?: boolean) {
  if (debug) console.log(result, label)
  if (!result) {
    return true
  }

  log(`File is linted "${label}"`, 'box')
  log('sep')
  return false
}

export async function applyRomeLint(fileName: string, directory: string) {
  if (!existsSync(fileName)) {
    log(`${fileName} is deleted`, 'error')

    return true
  }

  const command = `rome check ${fileName} --apply-suggested`
  console.log(directory, command, 'rome command')
  let logs = await exec({cwd: directory, command})
  console.log(logs, 'logs')
}

export async function applyLint(fileName: string, forceTypescript: boolean) {
  const debug = false
  if (!existsSync(fileName)) {
    log(`${fileName} is deleted`, 'error')

    return true
  }

  log('sep')
  log(`will lint ${fileName}`, 'info')
  log('sep')

  const baseProps = {
    filePath: fileName,
    debug,
    forceTypescript,
    useAlternativeExecCommand: false,
  }

  const initialLintResult = await lintFn(baseProps)
  if (!checkShouldContinue(initialLintResult, 'initial', debug)) return true

  const lintResultWithOuter = await lintFn({
    ...baseProps,
    prettierSpecialCase: 'outer',
  })
  if (!checkShouldContinue(lintResultWithOuter, 'outer', debug)) return true
  const lintResultWithLocal = await lintFn({
    ...baseProps,
    prettierSpecialCase: 'local',
  })
  if (!checkShouldContinue(lintResultWithLocal, 'local', debug)) return true
  log('File failed to be linted', 'error')

  return false
}
