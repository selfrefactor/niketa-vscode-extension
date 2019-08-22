const { setter, getter } = require('rambdax')

function saved({ filePath, rabbitHole }){
  const currentMode = getter('MODE')

  if (currentMode === 'OFF') return

  if (currentMode !== 'LOCK_FILE') return rabbitHole(filePath)

  if (!getter('LOCK_FILE')) setter('LOCK_FILE', filePath)

  rabbitHole(getter('LOCK_FILE'))
}

exports.saved = saved
