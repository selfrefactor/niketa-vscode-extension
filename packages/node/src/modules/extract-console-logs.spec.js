import {
  testInput,
  testInputSecond,
  testInputThird,
} from '../../test-data/extract-logs/data'
import { newJest } from '../../test-data/extract-logs/new-jest'
import { oldJest } from '../../test-data/extract-logs/old-jest'
import { extractConsoleLogs, withNewJest } from './extract-console-logs'

test.only('new jest', () => {
  const result = withNewJest(newJest)
  expect(result).toMatchSnapshot()
})

test('happy', () => {
  const result = extractConsoleLogs(testInput)
  expect(result).toMatchSnapshot()
})

test('multiple logs on same line', () => {
  const result = extractConsoleLogs(testInputSecond)
  expect(result).toMatchSnapshot()
})

test('bug', () => {
  const result = extractConsoleLogs(testInputThird)
  expect(result).toMatchSnapshot()
})
