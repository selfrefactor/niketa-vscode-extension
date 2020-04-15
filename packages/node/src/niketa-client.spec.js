import {resolve} from 'path'
import { NiketaClient } from './niketa-client.js'
jest.setTimeout(20000)

const throwingSyncTest = resolve(__dirname, '../test-data/failed-code/sync.js')
const throwingAsyncTest = resolve(__dirname, '../test-data/failed-code/async.js')
const angularDir = resolve(__dirname, '../../../../rambda-docs')
const htmlFile = resolve(__dirname, '../../../../rambda-docs/src/app/whole/whole.component.html')
const angularFile = resolve(__dirname, '../../../../rambda-docs/src/app/helpers/foo.ts')
const angularSpec = resolve(__dirname, '../../../../rambda-docs/src/app/helpers/foo.spec.ts')
const scssFile = resolve(__dirname, '../../../../rambda-docs/src/styles.scss')

const FAILED_EXPECTATIONS = {
  specHasLogsFile: resolve(__dirname, '../test-data/failed-expectation/spec-has-logs.js'),
  specHasLogsSpec: resolve(__dirname, '../test-data/failed-expectation/spec-has-logs.spec.js'),
  fileHasLogsFile: resolve(__dirname, '../test-data/failed-expectation/file-has-logs.js'),
  fileHasLogsSpec: resolve(__dirname, '../test-data/failed-expectation/file-has-logs.spec.js'),
  bothHaveLogsFile: resolve(__dirname, '../test-data/failed-expectation/both-have-logs.js'),
  bothHaveLogsSpec: resolve(__dirname, '../test-data/failed-expectation/both-have-logs.spec.js')
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
  niketaClient = new NiketaClient(9999, emit)
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

function generateMessage(input){
  return JSON.stringify({
    hasWallaby     : false,
    dir            : testDir,
    withLockedFile : false,
    ...input
  })
}


Object.keys(SUCCESS).forEach(testKey => {
    test(`success - ${testKey}`, async () => {
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
          fileName : FAILED_EXPECTATIONS[testKey]
        }))
        expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
    })
  }
)

test('sync code that throws', async () => {
    await niketaClient.onSocketData(generateMessage({
      fileName : throwingSyncTest
    }))
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
})

test('async code that throws', async () => {
    await niketaClient.onSocketData(generateMessage({
      fileName : throwingAsyncTest
    }))
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
})

test('real case 1', async () => {
    const message = `{"fileName":"/home/s/repos/rambda/source/adjust.js","hasWallaby":false,"withLockedFile":false,"dir":"/home/s/repos/rambda"}`
    await niketaClient.onSocketData(message)
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
}) 

test('real case 2', async () => {
    const message = `{"fileName":"/home/s/repos/rambda/source/delay.spec.js","hasWallaby":false,"withLockedFile":false,"dir":"/home/s/repos/rambda"}`
    await niketaClient.onSocketData(message)
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
}) 

test.only('with angular', async () => {
  await niketaClient.onSocketData(generateMessage({
    fileName : angularFile,
    forceLint: true,
    dir:angularDir
  }))
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
}) 

