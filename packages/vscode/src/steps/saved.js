const { setter, getter, any } = require('rambdax')
const lintOnly = [ '.html', '.css', '.scss' ]
const allowed = [ ...lintOnly, '.js', '.ts' ]

const isLintOnly = filePath => any(x => filePath.endsWith(x))(lintOnly)

function saved({ filePath, rabbitHole }){
  if (!allowed.some(x => filePath.endsWith(x))) return

  const currentMode = getter('MODE')

  if (currentMode === 'OFF') return
  if (currentMode !== 'LOCK_FILE') return rabbitHole(filePath)
  if (isLintOnly(filePath)) return rabbitHole(filePath)

  if (!getter('LOCK_FILE')) setter('LOCK_FILE', filePath)

  rabbitHole(getter('LOCK_FILE'))
}

exports.saved = saved
