import { execNodeFile } from './ants/execNodeFile'
import { show } from './emitters/show'
import { additional } from './emitters/additional.js'
import { ERROR_ICON } from './coverageMode.js'
import { remove, take, wait } from 'rambdax'

const LIMIT = 150
const SEPARATOR = '🚦'

export async function proveMode({
  dir,
  stopLoaders,
  startLoaders,
  notify,
  notifyClose,
  emit,
  filePath,
}){
  startLoaders()

  console.log('PROVE_MODE', filePath)
  const [ execResult, err ] = await wait(execNodeFile({
    cwd  : dir,
    file : filePath,
  }))
  console.log('PROVE_MODE_END', filePath)
  stopLoaders()

  if (execResult === undefined){
    console.log('execResult === undefined', err)

    return show(emit, ERROR_ICON)
  }

  const toShow = err ?
    remove([ filePath, /\n/g ], err) :
    remove(/\n/g, execResult.join(SEPARATOR))

  if (toShow.length === 0) return
  additional(emit)

  console.log(err ? err : execResult)

  if (toShow.length < LIMIT) return show(emit, toShow)

  if (!notifyClose){

    return show(emit, `${ take(LIMIT, toShow) } ...`)
  }

  notify(execResult.join('\n'))
  notifyClose()
}
