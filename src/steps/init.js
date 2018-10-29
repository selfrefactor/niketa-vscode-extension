const _ = require('../keys')
const fastify = require('fastify')()
const io = require('socket.io')(fastify.server)
const vscode = require('vscode')
const { emit } = require('../_modules/emitter')
const { getter } = require('../_helpers/internalData')
const { ok, head, path } = require('rambdax')
const { show, startSpinner, stopSpinner } = require('../bar')

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

io.on(_.CONNECTION, socket => {
  console.log('connected', 3011)

  socket.on('startSpinner', startSpinnerRoute)
  socket.on('stopSpinner', stopSpinnerRoute)
  socket.on('show', showRoute)
})

function rabbitHole(e){
  const dir = path(
    'uri.path', head(vscode.workspace.workspaceFolders)
  )

  emit({
    channel  : 'fileSaved',
    dir,
    filePath : e.fileName,
    hasReact : false,
    mode     : getter('MODE'),
  })
}

function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(e => {
    rabbitHole(e)
  })
}

fastify.listen(
  3011
)

exports.init = () => {
  initWatcher()
}
