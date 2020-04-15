import { ms } from 'string-fn'
import { NiketaClient } from './niketa-client.js'
import { generateMessage, TYPESCRIPT, getFullSnap } from './test-data.js'
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

test('typescipt scenario', async () => {
  const step = async fileName => {
    await niketaClient.onSocketData(generateMessage({
      fileName,
      hasTypescript: true,
      dir:TYPESCRIPT.dir
    }))
  }
  
  await step(TYPESCRIPT.typescriptFile)
  await step(TYPESCRIPT.typescriptSpec)
  await step(TYPESCRIPT.typescriptFile)

  expect(getFullSnap({niketaClient, emit})).toMatchSnapshot()
}) 
