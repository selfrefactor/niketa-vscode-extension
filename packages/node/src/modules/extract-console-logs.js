import { anyFalse, map, remove, take, trim } from 'rambdax'
const LIMIT = 115
const MARK = 'NIKETA_MARKER'

function mergeLogs(hash){
  const iterable = x => {
    const lineDecoration = []

    map((xx, lineNumber) => {
      const decoration = xx.length === 1 ? xx[ 0 ] : xx.join(' ')
      lineDecoration.push({
        decoration,
        line : lineNumber,
      })
    })(x)

    return lineDecoration
  }

  return map(iterable)(hash)
}

export function extractConsoleLogs(input){
  const withMarker = input.replace(/console\.log/g, `${ MARK } console.log`)

  const parts = withMarker.split('console.log')
  const hash = {}

  const extractor = (part, i) => {
    const partialLines = part
      .split('\n')
      .filter(Boolean)
      .filter(x => !x.includes(MARK))
      .map(trim)

    if (partialLines.length === 0) return

    const logLines = []
    let found = false
    let fileName = ''
    let lineNumber = 0

    partialLines.forEach(partialLine => {
      if (found) return
      const matched = partialLine.match(/\([a-zA-Z\-\.\/]+:[0-9]+:[0-9]+\)$/)

      if (!matched && !found) return logLines.push(partialLine)
      found = true

      const [ fileNameRaw, lineNumberRaw ] = matched[ 0 ].split(':')

      lineNumber = Number(lineNumberRaw)
      fileName = remove([ '(', ')' ])(fileNameRaw)
    })
    if (anyFalse(
      found, lineNumber, fileName
    )) return

    if (hash[ fileName ] === undefined) hash[ fileName ] = {}
    if (hash[ fileName ][ lineNumber ] === undefined)
      hash[ fileName ][ lineNumber ] = []

    const decoration = take(LIMIT)(logLines.join(' '))
    hash[ fileName ][ lineNumber ].push(decoration)
  }

  parts.forEach(extractor)

  return mergeLogs(hash)
}

/*
  function mergeLogsFn(logData){
  const toReturn = {}

  Object.keys(logData).forEach(key => {
    const currentDecoration = logData[ key ]
    const foundLines = []
    const mergedDecoration = []

    currentDecoration.forEach(({ line, decoration }, i) => {
      if (foundLines.includes(line)) return
      foundLines.push(line)

      const allLogs = currentDecoration
        .filter(x => x.line === line)
        .map(x => x.decoration)

      if (allLogs.length === 1){
        return mergedDecoration.push({
          line,
          decoration,
        })
      }
      const joinedDecoration = take(LIMIT, allLogs.join(', '))

      return mergedDecoration.push({
        line,
        decoration : joinedDecoration,
      })
    })
    toReturn[ key ] = mergedDecoration
  })

  return toReturn
}

export function withOldJest(input){
  const lines = input.split('\n')
  const toReturn = {}

  lines.forEach((line, i) => {
    if (line.trim().startsWith('console.log')){
      const [ , fileNameAndLine ] = line.split('console.log')
      if (!fileNameAndLine.includes(':')) return

      const [ fileName, lineNumber ] = fileNameAndLine
        .split(':')
        .map(x => x.trim())

      if (toReturn[ fileName ] === undefined) toReturn[ fileName ] = []

      const log = lines[ i + 1 ]
      if (log === undefined) return

      toReturn[ fileName ].push({
        line       : lineNumber,
        decoration : log.trim(),
      })
    }
  })

  return mergeLogsFn(toReturn)
}

*/
