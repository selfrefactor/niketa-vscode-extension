import {resolve} from 'path'
import { NiketaClient } from './niketa-client.js'
import { execJest } from './utils/exec-jest.js'
jest.setTimeout(10000)

const specHasLogsFile = resolve(__dirname, '../test-data/success/spec-has-logs.js')
const specHasLogsSpec = resolve(__dirname, '../test-data/success/spec-has-logs.spec.js')

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

function generateMessage(input){
  return JSON.stringify({
    disableLint    : false,
    hasWallaby     : false,
    dir            : testDir,
    withLockedFile : false,
    ...input
  })
}

test('spec has logs - changed source', async () => {
  try {
    await niketaClient.onSocketData(generateMessage({
      fileName : specHasLogsFile
    }))
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
  } catch (e){
    console.log({ e }, 'catch')
  }
})

test('spec has logs - changed spec', async () => {
  try {
    await niketaClient.onSocketData(generateMessage({
      fileName : specHasLogsSpec
    }))
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
  } catch (e){
    console.log({ e }, 'catch')
  }
})

