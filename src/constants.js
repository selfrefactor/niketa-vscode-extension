const DEFAULT_MODE = 'WITH_COVERAGE'

const MODES = [
  DEFAULT_MODE,
  'LOCK_FILE',
  'LINT_ONLY',
  'OFF',
]

exports.MODES = MODES

exports.START = 'niketa.start'
exports.CHANGE_MODE = 'niketa.changeMode'
