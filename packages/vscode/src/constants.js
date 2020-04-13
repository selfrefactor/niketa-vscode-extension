const DEFAULT_MODE = 'WITH_COVERAGE'

const MODES = [ DEFAULT_MODE, 'LOCK_FILE', 'LINT_ONLY', 'OFF' ]

exports.MODES = MODES

exports.START = 'niketa.start'
exports.START_DEMO = 'niketa.start.demo'
exports.CHANGE_MODE = 'niketa.changeMode'
exports.REQUEST_CANCELATION = 'niketa.request.cancelation'
