import { bothHaveLogs } from './both-have-logs'

test('happy', () => {
  bothHaveLogs(2)
  console.log({
    a : 1,
    b : 2,
  })
})
