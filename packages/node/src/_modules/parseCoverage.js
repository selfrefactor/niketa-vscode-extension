import { glue, remove, startsWith, trim } from 'rambdax'

import { createFileKey } from '../_helpers/createFileKey'

function cleanAngularLog(x){
  return {
    ...x,
    stderr : remove(/ts-jest\[.+/, x.stderr),
  }
}

function toNumber(x){
  return x === undefined || Number.isNaN(Number(x)) ? 0 : Number(x)
}

function parse(x){
  const result = Math.round(x * 100) / 100

  return parseFloat(`${ result }`)
}

const holder = {}

const maybeWarn = x => x < 0 ? `❗${ x }` : x

function diff(inputs, filePath){
  const fileKey = createFileKey(filePath)
  const firstTime = holder[ fileKey ] === undefined
  const [ statements, branch, func, lines ] = inputs.map(toNumber)

  const hash = {
    branch,
    func,
    lines,
    statements,
  }

  if (firstTime){
    holder[ fileKey ] = hash

    return glue(`
      🐰
      st:
      ${ statements }
      br:
      ${ branch }
      fn:
      ${ func }
      lns:
      ${ lines }
    `)
  }

  const statementsDiff = parse(statements - holder[ fileKey ].statements)
  const branchDiff = parse(branch - holder[ fileKey ].branch)
  const funcDiff = parse(func - holder[ fileKey ].func)
  const linesDiff = parse(lines - holder[ fileKey ].lines)

  holder[ fileKey ] = hash

  const message = glue(`
    ${ statementsDiff === 0 ? '' : `✍:${ maybeWarn(statementsDiff) }` }
    ${ branchDiff === 0 ? '' : `🎋:${ maybeWarn(branchDiff) }` }
    ${ funcDiff === 0 ? '' : `☈:${ maybeWarn(funcDiff) }` }
    ${ linesDiff === 0 ? '' : `📜:${ maybeWarn(linesDiff) }` }
  `)

  return message.trim() === '' ? '⛹' : message
}

export function parseCoverage(
  execResultInput, fileName, filePath
){
  const execResult = cleanAngularLog(execResultInput)
  const pass = execResult.stderr.startsWith('PASS')

  const [ line ] = execResult.stdout
    .split('\n')
    .filter(startsWith(` ${ fileName }`))

  if (line === undefined){
    return {
      pass,
      message : 'LINE === undefined',
    }
  }

  const [ , statements, branch, func, lines, uncovered ] = line
    .split('|')
    .map(trim)

  const message = diff([ statements, branch, func, lines ], filePath)

  return {
    pass,
    message : message === undefined ? 'MESSAGE === undefined' : message,
    uncovered,
  }
}
