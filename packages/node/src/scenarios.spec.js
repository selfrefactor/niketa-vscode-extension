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

test('scenario 1', async () => {
  const step = async fileName => {
    await niketaClient.onSocketData(generateMessage({
      fileName
    }))
  }
  
  await step(SUCCESS.bothHaveLogsFile)
  await step(FAILED_EXPECTATIONS.fileHasLogsSpec)
  await step(SUCCESS.bothHaveLogsSpec)
  await step(SUCCESS.fileHasLogsFile)

  expect(getFullSnap({niketaClient, emit})).toMatchSnapshot()
}) 
