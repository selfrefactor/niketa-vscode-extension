const { emitToBar } = require('../bar')
const { getter, setter } = require('rambdax')
const { MODES } = require('../constants')

function changeMode(){
  const oldMode = getter('MODE')
  const oldIndex = MODES.indexOf(oldMode)
  const newIndex = oldIndex === MODES.length - 1 ?
    0 :
    oldIndex + 1

  const newMode = MODES[ newIndex ]
  setter('MODE', newMode)

  emitToBar({
    name      : 'secondBar',
    text      : newMode,
    afterText : '',
  })
}

exports.changeMode = changeMode
