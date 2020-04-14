import { bothHaveLogs } from './both-have-logs.js'

test('happy', () => {
  bothHaveLogs(0)
  bothHaveLogs(1)
  bothHaveLogs(2)
  console.log({a: 1, b: 2})
})