import { ms } from 'string-fn'
import { NiketaClient } from './niketa-client.js'
jest.setTimeout(ms('4 minutes'))

import {
  throwingSyncTest,
  throwingAsyncTest,
  generateMessage,
  SUCCESS,
  FAILED_EXPECTATIONS
} from './test-data'

let niketaClient
const emit = jest.fn()

beforeEach(() => {
  niketaClient = new NiketaClient({port:9999, emit, testing: true})
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

Object.keys(SUCCESS).forEach(testKey => {
  // if(testKey !== 'bothHaveLogsFile') return
  test(`success - ${testKey}`, async () => {
      await niketaClient.onSocketData(generateMessage({
        fileName : SUCCESS[testKey]
      }))
      expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
  })
})

Object.keys(FAILED_EXPECTATIONS).forEach(testKey => {
  test(`failed expectation - ${testKey}`, async () => {
      await niketaClient.onSocketData(generateMessage({
        fileName : FAILED_EXPECTATIONS[testKey]
      }))
      expect(emit.mock.calls[ 0 ]).toMatchSnapshot()
  })
})

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