import { fileHasLogs } from './file-has-logs'

test('happy', () => {
  fileHasLogs(9)
  expect(1).toBe(1)
})
