import { exec } from 'helpers'
import { show } from './emitters/show'
import { additional } from './emitters/additional.js'
import { remove, take } from 'rambdax'

const LIMIT = 150
const SEPARATOR = '🚦'
export async function proveMode({
  dir,
  emit,
  filePath,
}){
  const execResult = await exec({
    cwd     : dir,
    command : `node ${ filePath }`,
  })

  const toShow = remove(/\n/g, execResult.join(SEPARATOR))
  if (toShow.length === 0) return
  additional(emit)

  if (toShow.length < LIMIT) return show(emit, toShow)

  return show(emit, `${ take(LIMIT, toShow) } ...`)

}
