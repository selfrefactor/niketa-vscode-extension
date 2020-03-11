import { clean } from '../_helpers/clean'
import { debugLog } from '../_helpers/debugLog'

export function parseBeforeNotify(input){
  const toReturn = input
    .split('\n')
    .map(clean)
    .join('\n')

  debugLog(input, 'parse before notify input')
  debugLog(toReturn, 'sending to electron')

  return toReturn
}
