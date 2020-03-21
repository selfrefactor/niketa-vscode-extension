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
const { saved } = require('./saved')

const { emit } = require('../_modules/emitter')
const { getCornerCases } = require('../_modules/getCornerCases')
const { getCwd } = require('../_modules/getCwd')
const { ok, getter } = require('rambdax')

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

function emitAnt({ filePath, mode }){
  const dir = getCwd(filePath)
  if (dir === false) return
  const { hasAngular, hasWallaby } = getCornerCases(dir)

  emit({
    channel : 'fileSaved',
    dir,
    filePath,
    hasAngular,
    hasWallaby,
    mode,
  })
}

function rabbitHole(filePath){
  emitAnt({
    filePath,
    mode : getter('MODE'),
  })
}

function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(e => {
    saved({
      filePath : e.fileName,
      rabbitHole,
    })
  })
}

fastify.listen(niketaConfig('PORT_0'))

exports.init = () => {
  initWatcher()
}
