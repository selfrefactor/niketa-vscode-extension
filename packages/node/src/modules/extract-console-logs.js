// import { outputFile } from 'fs-extra'
import { anyFalse, map, remove, take, trim } from 'rambdax'
const LIMIT = 115
const MARK = 'NIKETA_MARKER'

function mergeLogs(hash){
  const iterable = x => {
    const lineDecoration = []

    map((xInstance, lineNumber) => {
      const decoration =
        xInstance.length === 1 ? xInstance[ 0 ] : xInstance.join(' ')
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
  // outputFile(`${ __dirname }/latest-log.txt`, input)
  const withMarker = input.replace(/console\.log/g, `${ MARK } console.log`)

  const parts = withMarker.split('console.log')
  const hash = {}

  const extractor = part => {
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
      const matched = partialLine.match(/\([a-zA-Z_\-\.\/]+:[0-9]+:[0-9]+\)$/)

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
