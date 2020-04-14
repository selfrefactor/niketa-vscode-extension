
export function extractConsoleLogs(input){
  const lines = input.split('\n')
  console.log({lines}, lines[22])
  const toReturn = {}

  lines.forEach((line, i) => {
    if(line.trim().startsWith('console.log')){
      const [, fileNameAndLine] = line.split('console.log')
      if(!fileNameAndLine.includes(':'))return

      const [fileName, lineNumber] = fileNameAndLine.split(':').map(x => x.trim())
      if(toReturn[fileName] === undefined) toReturn[fileName] = []
      const log = lines[i + 1]
      if(log === undefined) return

      toReturn[fileName].push({
        line:lineNumber,
        logged: log.trim()
      })
    }
  }) 
  
  return toReturn
}
