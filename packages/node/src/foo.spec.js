import {execJest} from './utils/exec-jest.js'
jest.setTimeout(30000)

test('happy', async () => {
  const cwd = '/home/s/repos/niketa/packages/node'
  const fileName = '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.spec.js'
  const result = await execJest(fileName, cwd)
  console.log(result)
  expect(1).toEqual(1)
})