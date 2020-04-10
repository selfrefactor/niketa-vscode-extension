import { pass } from 'rambdax'

const modes = [ 'LOCK_FILE', 'WITH_COVERAGE', 'LINT_ONLY' ]
const schema = {
  dir        : 'string',
  filePath   : 'string',
  hasAngular : 'boolean',
  hasWallaby : 'boolean',
  mode       : modes,
}

export function checkExtensionMessage(message){
  return pass(message)(schema)
}
