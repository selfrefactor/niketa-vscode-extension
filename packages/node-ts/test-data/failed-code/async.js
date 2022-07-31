import {delay} from 'rambdax'

export async function asyncTest() {
  console.log(1)
  await delay(100)
  JSON.parse('{a:')
}
