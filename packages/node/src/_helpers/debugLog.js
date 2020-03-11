import { getter, repeat } from 'rambdax'

const SHORT_SEPARATOR = repeat('🍄', 2).join``
const SEPARATOR = repeat('🍺', 20).join``

export function debugLog(toLog, label = 'debug log'){
  if (!getter('DEBUG_LOG')) return

  console.log(label, SHORT_SEPARATOR)
  console.log(SEPARATOR)
  console.log(toLog)
  console.log(SEPARATOR)
}
