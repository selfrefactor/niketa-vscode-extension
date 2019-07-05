import { remove } from 'rambdax'

export function additional(emit, message){
  if (typeof message !== 'string'){
    return emit({
      channel : 'additional',
      message : '',
    })
  }

  const uncovered = remove('...', message)
  const messageChild = message.includes('...') ?
    `⛱${ uncovered }` :
    `☔${ uncovered }`

  emit({
    channel : 'additional',
    message : messageChild,
  })
}
