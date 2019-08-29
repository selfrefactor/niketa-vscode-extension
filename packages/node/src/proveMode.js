import { exec } from 'helpers'
import { show } from './emitters/show'
import { remove, take } from 'rambdax'

const LIMIT = 150
const SEPARATOR = '🚦'
export async function proveMode({
  dir,
  emit,
  filePath,
  notify,
  notifyClose,
}){
  const execResult = await exec({
    cwd: dir,
    command: `node ${filePath}`
  })
  
  const toShow = remove(/\n/g,execResult.join(SEPARATOR))
  if(toShow.length === 0) return
  if(toShow.length < LIMIT) return show(emit, toShow)

  if(!notifyClose){
    return show(emit, `${take(LIMIT, toShow)} ...`)
  }

  notify(execResult)
  notifyClose()
}