import { take } from 'rambdax'
const LIMIT = 60

function mergeLogs(logData){
  const toReturn = {}
  
  Object.keys(logData).forEach(key => {
    const currentDecoration = logData[key]
    const foundLines = []
    const mergedDecoration = []

    currentDecoration.forEach(({line,decoration}, i) => {
      if(foundLines.includes(line)) return
      foundLines.push(line)

      const allLogs = currentDecoration.filter(x => {
        return x.line === line
      }).map(x => x.decoration)

      if(allLogs.length === 1){
        return mergedDecoration.push({line,decoration})
      }
      const joinedDecoration = take(LIMIT, allLogs.join(', '))
      
      return mergedDecoration.push({line,decoration: joinedDecoration})
    })
    toReturn[key] = mergedDecoration
  })

  return toReturn
}

export function extractConsoleLogs(input){
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

  return mergeLogs(toReturn)
}
