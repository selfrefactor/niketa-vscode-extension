import {resolve} from 'path'
import { delay } from 'rambdax'
import { ms } from 'string-fn'
import { NiketaClient } from './niketa-client.js'
jest.setTimeout(ms('4 minutes'))

const throwingSyncTest = resolve(__dirname, '../test-data/failed-code/sync.js')
const throwingAsyncTest = resolve(__dirname, '../test-data/failed-code/async.js')
const angularDir = resolve(__dirname, '../../../../rambda-docs')
const typescriptDir = resolve(__dirname, '../../../../services/packages/tag-fn')
const typescriptSpec = resolve(__dirname, '../../../../services/packages/tag-fn/src/modules/getNextTag.spec.ts')
const typescriptFile = resolve(__dirname, '../../../../services/packages/tag-fn/src/modules/getNextTag.ts')

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
  niketaClient = new NiketaClient({port:9999, emit, testing: true})
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

function generateMessage(input){
  return JSON.stringify({
    hasWallaby     : false,
    forceLint   : false,
    hasTypescript     : false,
    dir            : testDir,
    ...input
  })
}

function getFullSnap(){
  return {
    lintOnlyFile: niketaClient.lintOnlyFileHolder,
    lintFile: niketaClient.lintFileHolder,
    emited: emit.mock.calls, 
    linted: niketaClient.lastLintedFiles, 
  }
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
    const message = `{"fileName":"/home/s/repos/rambda/source/adjust.js","hasWallaby":false,"dir":"/home/s/repos/rambda"}`
    await niketaClient.onSocketData(message)
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
}) 

test('real case 2', async () => {
    const message = `{"fileName":"/home/s/repos/rambda/source/delay.spec.js","hasWallaby":false,"dir":"/home/s/repos/rambda"}`
    await niketaClient.onSocketData(message)
    expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
}) 

test('with angular source - force lint', async () => {
  const currentFile = angularFile
  await niketaClient.onSocketData(generateMessage({
    fileName : currentFile,
    forceLint: true,
    hasTypescript: true,
    dir:angularDir
  }))
  expect(niketaClient.lastLintedFiles[0]).toBe(undefined)
  await delay(3000)
  expect(niketaClient.lastLintedFiles[0]).toBe(currentFile)
  expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
}) 

test.only('angular scenario', async () => {
  const step = async fileName => {
    await niketaClient.onSocketData(generateMessage({
      fileName,
      hasTypescript: true,
      dir:angularDir
    }))
  }
  
  await step(htmlFile)
  await step(angularSpec)
  await step(scssFile)
  await step(angularFile)
  await step(scssFile)

  expect(getFullSnap()).toMatchSnapshot()
}) 

