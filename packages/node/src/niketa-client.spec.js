import { NiketaClient } from './niketa-client.js'
import { execJest } from './utils/exec-jest.js'
jest.setTimeout(10000)

const testDir = '/home/s/repos/niketa/packages/node'
const testFileName =
  '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.spec.js'
const sourceFileName =
  '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.js'

test.skip('happy', async () => {
  const cwd = '/home/s/repos/niketa/packages/node'
  const result = await execJest(testFileName, cwd)
  console.log(result)
})

let niketaClient
const emit = jest.fn()

beforeEach(() => {
  niketaClient = new NiketaClient(3939, emit)
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

test('scenario - unreliable decorator data', async () => {
  try {
    const firstMessage = JSON.stringify({
      fileName       : sourceFileName,
      disableLint    : false,
      hasWallaby     : false,
      dir            : testDir,
      withLockedFile : false,
    })

    await niketaClient.onSocketData(firstMessage)
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
  } catch (e){
    console.log({ e }, 'catch')
  }
})

test('scenario - correct decoration', async () => {
  try {
    const firstMessage = JSON.stringify({
      fileName       : testFileName,
      disableLint    : false,
      hasWallaby     : false,
      dir            : testDir,
      withLockedFile : false,
    })
    await niketaClient.onSocketData(firstMessage)
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
  } catch (e){
    console.log({ e }, 'catch')
  }
})
