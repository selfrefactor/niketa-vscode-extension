import { clean } from './cleanx'
import { debugLog } from '../src/_helpers/debugLog'

export function parseBeforeNotify(input){
  if (input === 1) return
  const toReturn = input.split('\n').map(clean)
    .join('\n')

  debugLog(input, 'parse before notify input')
  debugLog(toReturn, 'sending to electron')

  return toReturn
}
