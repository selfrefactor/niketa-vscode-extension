import {filter} from 'rambdax'
import {EvaluateDecorations} from 'src/interfaces'

export function evaluateDecorations(input: EvaluateDecorations) {
  const {newDecorationsData, fileName, hasTypescript} = input
  const unreliableLogData: Record<string, any> = []
  const reliableLogData: Record<string, any> = {}

  const triggerFileHasDecoration = filter<any>(
    (logData: any, prop: string) => {
      const okLogData = fileName.endsWith(prop)

      logData.map((x: any) => {
        unreliableLogData.push(x.decoration)
        if (okLogData) {
          reliableLogData[x.line] = x.decoration
        }
      })

      return okLogData
    },
    newDecorationsData
  )

  const correct =
    !hasTypescript && Object.keys(triggerFileHasDecoration).length === 1
  const logData = correct ? reliableLogData : unreliableLogData

  return {
    correct,
    logData,
  }
}
