const { niketaConfig } = require('./_modules/niketaConfig')

const DEFAULT_MODE = niketaConfig('DEFAULT_MODE')

const MODES_LIST = [
  'LOCK_FILE',
  'LINT_ONLY',
  'NO_COVERAGE',
  'WITH_COVERAGE',
  'OFF',
]

const withoutDefault = MODES_LIST.filter(x => x !== DEFAULT_MODE)

exports.MODES = [
  DEFAULT_MODE,
  ...withoutDefault,
]

exports.START = 'niketa.start'
exports.CHANGE_MODE = 'niketa.changeMode'
