const vscode = require('vscode')

const DEFAULT_MODE = vscode
  .workspace
  .getConfiguration('niketa')
  .get('defaultMode')

const MODES_LIST = [
  'NO_COVERAGE',
  'WITH_COVERAGE',
  'OFF',
]

const withoutDefault = MODES_LIST.filter(x => x!== DEFAULT_MODE)

exports.MODES = [
  DEFAULT_MODE,
  ...withoutDefault
]

exports.START = 'niketa.start'
exports.CHANGE_MODE = 'niketa.changeMode'