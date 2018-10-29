const fastify = require('fastify')()
const io = require('socket.io')(fastify.server)
const vscode = require('vscode')
const { emit } = require('../_modules/emitter')
const { hasReact } = require('../_modules/hasReact')
const { ok, head, path, getter } = require('rambdax')
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

io.on('connection', socket => {
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
    hasReact: hasReact(dir),
    mode     : getter('MODE'),
  })
}

function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(e => {
    if(getter('MODE') !== 'OFF') rabbitHole(e)
  })
}

fastify.listen(
  3011
)

exports.init = () => {
  initWatcher()
}
