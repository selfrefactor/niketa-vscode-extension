import { asyncTest } from './async'

test('happy', async () => {
  console.log([1,2,3])
  await asyncTest()
})