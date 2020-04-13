import {execJest} from './utils/exec-jest.js'
import {NiketaClient} from './niketa-client.js'
jest.setTimeout(30000)

const testDir = '/home/s/repos/niketa/packages/node'
const testFileName = '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.spec.js'
const sourceFileName = '/home/s/repos/niketa/packages/node/src/_modules/parseBeforeNotify.js'
test.skip('happy', async () => {
  const cwd = '/home/s/repos/niketa/packages/node'
  const result = await execJest(testFileName, cwd)
  console.log(result)
  expect(1).toEqual(1)
})

let niketaClient
let emit = jest.fn()
beforeEach(() => {
  niketaClient= new NiketaClient(3939, )
})
afterEach(() => {
  niketaClient = undefined
  emit.mockClear()
})

// test('Get Jest command - when foo.js', () => {
  
// })

test('Scenario', async () => {
  try{
    const firstMessage = JSON.stringify({
      fileName: testFileName,
      disableLint: false,
      hasWallaby: false,
      dir: testDir,
      withLockedFile: false
    })
    const execResult = await niketaClient.onSocketData(firstMessage)
    process.stderr.write(execResult.stderr)
    process.stderr.write(execResult.stdout)
  }catch(e){
    console.log({e},'catch')
  }

})