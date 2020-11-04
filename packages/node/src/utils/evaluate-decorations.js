import { filter } from 'rambdax'
export function  evaluateDecorations({ newDecorationsData, fileName, hasTypescript }){
  const unreliableLogData = []
  const reliableLogData = {}

  const triggerFileHasDecoration = filter((logData, prop) => {
    const okLogData = fileName.endsWith(prop)

    logData.map(({ line, decoration }) => {
      unreliableLogData.push(decoration)
      if (okLogData){
        reliableLogData[ line ] = decoration
      }
    })

    return okLogData
  })(newDecorationsData)

  const correct =
    !hasTypescript && Object.keys(triggerFileHasDecoration).length === 1
  const logData = correct ? reliableLogData : unreliableLogData

  return {
    correct,
    logData,
  }
}