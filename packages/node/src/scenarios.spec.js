import { delay } from 'rambdax'
import { ms } from 'string-fn'
import { NiketaClient } from './niketa-client.js'
import { generateMessage,   SUCCESS,
  FAILED_EXPECTATIONS, getFullSnap } from './test-data.js'
jest.setTimeout(ms('2 minutes'))

let niketaClient
const emit = jest.fn()

beforeEach(() => {
  niketaClient = new NiketaClient({port:9999, emit, testing: true})
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

test('happy scenario', async () => {
  const step = async fileName => {
    await niketaClient.onSocketData(generateMessage({
      fileName
    }))
  }
  
  await step(SUCCESS.bothHaveLogsFile)
  await step(FAILED_EXPECTATIONS.fileHasLogsSpec)
  await step(SUCCESS.bothHaveLogsSpec)
  await step(SUCCESS.fileHasLogsFile)
  await delay(5000)

  expect(getFullSnap({niketaClient, emit})).toMatchSnapshot()
}) 

test('parallel scenario', async () => {
  const step = async fileName => {
    await niketaClient.onSocketData(generateMessage({
      fileName
    }))
  }
  
  await Promise.all([ step(SUCCESS.bothHaveLogsFile), step(FAILED_EXPECTATIONS.specHasLogsFile)])
  await step(FAILED_EXPECTATIONS.fileHasLogsSpec)
  await step(SUCCESS.fileHasLogsFile)
  await step(FAILED_EXPECTATIONS.specHasLogsSpec)
  await delay(5000)
  expect(getFullSnap({niketaClient, emit})).toMatchSnapshot()
}) 