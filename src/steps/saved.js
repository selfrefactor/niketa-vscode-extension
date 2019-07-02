const { setter,getter, match } = require('rambdax')
const WORDS = /[A-Z]?[a-zößüä]+|[A-Z]+(?![a-z])+/g

function constantCase(input){
  return input
    .match(WORDS)
    .map(x => x.toUpperCase())
    .join('_')
}

function whenNiketa({text, emitAnt, filePath}){
  const matched = match(/sk_.+/, text)

  if(!matched[0]) return

  const mode = constantCase(`niketa.${matched[0]}`)

  emitAnt({
    filePath,
    mode
  })
}

async function saved({filePath,emitAnt, rabbitHole, text, isNiketa}){
  const currentMode = getter('MODE')

  if (currentMode === 'OFF') return

  if(isNiketa){

    return whenNiketa({
      text, 
      filePath, 
      emitAnt
    })
  } 
  if (currentMode !== 'LOCK_FILE') return rabbitHole(filePath)

  if (!getter('LOCK_FILE')) setter('LOCK_FILE', filePath)

  rabbitHole({ fileName : getter('LOCK_FILE') })
}

exports.saved = saved