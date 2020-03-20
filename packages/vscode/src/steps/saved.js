const { setter, getter } = require('rambdax')
const allowed = [ '.js', '.ts', '.html', '.css' ]

function saved({ filePath, rabbitHole }){
  if (!allowed.some(x => filePath.endsWith(x))) return
  const currentMode = getter('MODE')

  if (currentMode === 'OFF') return

  if (currentMode !== 'LOCK_FILE' || filePath.endsWith('.html') || filePath.endsWith('.css')){
    return rabbitHole(filePath)
  }

  if (!getter('LOCK_FILE')) setter('LOCK_FILE', filePath)

  rabbitHole(getter('LOCK_FILE'))
}

exports.saved = saved
