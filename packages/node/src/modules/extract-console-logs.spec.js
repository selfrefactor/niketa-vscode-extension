import {
  testInput,
  testInputSecond,
  testInputThird,
} from '../../test-data/extract-logs/data'
import { newJest, bug } from '../../test-data/extract-logs/new-jest'
import { extractConsoleLogs } from './extract-console-logs'

test('bug', async () => {
  const result = extractConsoleLogs(bug)
  expect(result).toMatchSnapshot()
})

test('happy only with new jest', () => {
  const result = extractConsoleLogs(newJest)
  expect(result).toMatchSnapshot()
})

test('old jest 1', () => {
  const result = extractConsoleLogs(testInput)
  expect(result).toMatchSnapshot()
})

test('old jest 2', () => {
  const result = extractConsoleLogs(testInputSecond)
  expect(result).toMatchSnapshot()
})

test('bug', () => {
  const result = extractConsoleLogs(testInputThird)
  expect(result).toMatchSnapshot()
})
