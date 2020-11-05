import {extractConsoleLogs} from '../modules/extract-console-logs'
import {evaluateDecorations} from './evaluate-decorations'
import {cleanJestOutput} from './clean-jest-output'

export function getNewDecorations({execResult, fileName, hasTypescript}) {
  const input = cleanJestOutput(execResult.stdout)
  const [consoleLogs] = input.split('----------------------|')
  const newDecorationsData = extractConsoleLogs(consoleLogs)
  if (Object.keys(newDecorationsData).length === 0) {
    return {hasDecorations: false}
  }

  const newDecorations = evaluateDecorations({
    newDecorationsData,
    fileName,
    hasTypescript,
  })

  return {
    hasDecorations: true,
    newDecorations,
  }
}
