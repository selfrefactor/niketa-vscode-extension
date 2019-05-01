const fastify = require('fastify')()
const io = require('socket.io')(fastify.server)
const vscode = require('vscode')
const {
  emitToBar,
  show,
  startSpinner,
  stopSpinner,
  tooltip,
} = require('../bar')
const { niketaConfig } = require('../_modules/niketaConfig')

const { emit } = require('../_modules/emitter')
const { getCwd } = require('../_modules/getCwd')
const { hasReact } = require('../_modules/hasReact')
const { ok, getter, setter } = require('rambdax')

function showRoute(request){
  ok(request)({ message : 'string' })
  show(request.message)
}

function startSpinnerRoute(){
  startSpinner()
}

function stopSpinnerRoute(){
  stopSpinner()
}

function tooltipRoute(request){
  ok(request)({ message : 'string' })
  tooltip(request.message)
}

function additionalRoute(request){
  ok(request)({ message : 'string' })
  emitToBar({
    name      : 'thirdBar',
    text      : request.message,
    afterText : request.message,
  })
}

io.on('connection', socket => {
  console.log('connected', niketaConfig('PORT_0'))

  socket.on('show', showRoute)
  socket.on('startSpinner', startSpinnerRoute)
  socket.on('stopSpinner', stopSpinnerRoute)
  socket.on('tooltip', tooltipRoute)
  socket.on('additional', additionalRoute)
})

function rabbitHole(e){
  const dir = getCwd(e.fileName)
  if (dir === false) return

  emit({
    channel  : 'fileSaved',
    dir,
    filePath : e.fileName,
    hasReact : hasReact(dir),
    mode     : getter('MODE'),
  })
}

function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(e => {
    const currentMode = getter('MODE')

    if (currentMode === 'OFF') return

    if (currentMode !== 'LOCK_FILE') return rabbitHole(e)

    if (!getter('LOCK_FILE')){
      setter('LOCK_FILE', e.fileName)
    }

    rabbitHole({ fileName : getter('LOCK_FILE') })
  })
}

fastify.listen(
  niketaConfig('PORT_0')
)

exports.init = () => {
  initWatcher()
}
