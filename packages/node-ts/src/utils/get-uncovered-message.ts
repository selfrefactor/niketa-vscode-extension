import {remove} from 'rambdax'

export function getUncoveredMessage(input: string | number | undefined) {
  if (input === undefined) return
  if (input === '') return
  if (input === 0) return

  const message = String(input)
  const uncovered = remove('...', message)

  return message.includes('...') ? `⛱${uncovered}` : `☔${uncovered}`
}
