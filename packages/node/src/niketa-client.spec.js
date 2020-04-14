import {resolve} from 'path'
import { mapAsync } from 'rambdax'
import { NiketaClient } from './niketa-client.js'
jest.setTimeout(10000)

const FAILED_EXPECTATIONS = {
  specHasLogsFile: resolve(__dirname, '../test-data/failed-expectation/spec-has-logs.js'),
  // specHasLogsSpec: resolve(__dirname, '../test-data/failed-expectation/spec-has-logs.spec.js'),
  // fileHasLogsFile: resolve(__dirname, '../test-data/failed-expectation/file-has-logs.js'),
  // fileHasLogsSpec: resolve(__dirname, '../test-data/failed-expectation/file-has-logs.spec.js'),
  // bothHaveLogsFile: resolve(__dirname, '../test-data/failed-expectation/both-have-logs.js'),
  // bothHaveLogsSpec: resolve(__dirname, '../test-data/failed-expectation/both-have-logs.spec.js')
}
const SUCCESS = {
  specHasLogsFile: resolve(__dirname, '../test-data/success/spec-has-logs.js'),
  specHasLogsSpec: resolve(__dirname, '../test-data/success/spec-has-logs.spec.js'),
  fileHasLogsFile: resolve(__dirname, '../test-data/success/file-has-logs.js'),
  fileHasLogsSpec: resolve(__dirname, '../test-data/success/file-has-logs.spec.js'),
  bothHaveLogsFile: resolve(__dirname, '../test-data/success/both-have-logs.js'),
  bothHaveLogsSpec: resolve(__dirname, '../test-data/success/both-have-logs.spec.js')
}

const testDir = '/home/s/repos/niketa/packages/node'

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


Object.keys(SUCCESS).forEach(testKey => {
    test.skip(`success - ${testKey}`, async () => {
        await niketaClient.onSocketData(generateMessage({
          fileName : SUCCESS[testKey]
        }))
        expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
    })
  }
)

Object.keys(FAILED_EXPECTATIONS).forEach(testKey => {
    test(`failed expectation - ${testKey}`, async () => {
        await niketaClient.onSocketData(generateMessage({
          fileName : SUCCESS[testKey]
        }))
        expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
    })
  }
)

// test('spec has logs - changed spec', async () => {
//     await niketaClient.onSocketData(generateMessage({
//       fileName : specHasLogsSpec
//     }))
//     expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
// })

