import { glue, remove, startsWith, trim } from 'rambdax'

import { createFileKey } from '../_helpers/createFileKey'
const SUCCESS_ICON = '🐬'

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

function extractNumber(text) {
  var justText = text.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

  return Number(justText.trim())  
}

export function parseCoverage(
  {execResult, actualFileName, fileName, extension}
){
  const input = cleanAngularLog(execResult)
  // const input = cleanAngularLog(execResult)
  const pass = input.stderr.includes('PASS')
  const jestOutputLines = input.stdout.split('\n')

  const [ line ] = jestOutputLines.filter(
    x => x.includes(`${actualFileName}${extension}`)
  )
  if (line === undefined){
    return {
      pass,
      message : SUCCESS_ICON,
    }
  }

  const [ , statements, branch, func, lines, uncovered ] = line
    .split('|')
    .map(extractNumber)
    
  console.log({
    statements, branch, func, lines, uncovered
  })
  const message = diff([ statements, branch, func, lines ], fileName)

  return {
    pass,
    message : message === undefined ? 'MESSAGE === undefined' : message,
    uncovered,
  }
}
