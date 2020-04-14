import {execJest} from './utils/exec-jest.js'
import {NiketaClient} from './niketa-client.js'
jest.setTimeout(10000)

const testDir = '/home/s/repos/niketa/packages/node'
const testFileName = '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.spec.js'
const sourceFileName = '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.js'

test.skip('happy', async () => {
  const cwd = '/home/s/repos/niketa/packages/node'
  const result = await execJest(testFileName, cwd)
  console.log(result)
})

let niketaClient
let emit = jest.fn()
beforeEach(() => {
  niketaClient= new NiketaClient(3939, emit)
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

test('Scenario', async () => {
  try{
    const firstMessage = JSON.stringify({
      fileName: testFileName,
      disableLint: false,
      hasWallaby: false,
      dir: testDir,
      withLockedFile: false
    })
    const result = await niketaClient.onSocketData(firstMessage)
    console.log(emit.mock.calls[0],91)
    expect(
      result
    ).toBeTruthy()
  }catch(e){
    console.log({e},'catch')
  }

})