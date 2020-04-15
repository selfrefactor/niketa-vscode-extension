import { remove } from 'rambdax'

export function getUncoveredMessage(message){
  if (typeof message !== 'string' || !message){
    return
  }

  const uncovered = remove('...', message)

  return message.includes('...') ? `⛱${ uncovered }` : `☔${ uncovered }`
}
