import { specHasLogs } from './spec-has-logs.js'

test('happy', () => {
  console.log([ 1, 2, 3 ], {
    a : 1,
    b : 2,
  })
  console.log(specHasLogs(9))
})
