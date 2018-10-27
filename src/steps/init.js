const vscode = require('vscode')
const fastify = require('fastify')()
const {getConfig} = require('../_helpers/getConfig')
const _ = require('../keys')
const {ok} = require('rambdax')
const {show, startSpinner, stopSpinner} = require('../bar')
const {getter, setter} = require('../_helpers/internalData')
const {emit} = require('../_modules/emitter')

const io = require('socket.io')(fastify.server);

function showRoute(request){
  if(!getter(_.ACTIVE_FLAG)) return
  
  ok(request)({message: 'string'})
  show(request.message)
}

function startSpinnerRoute(){
  startSpinner()
}

function stopSpinnerRoute(){
  stopSpinner()
}

io.on(_.CONNECTION, socket => {
  socket.on('startSpinner', startSpinnerRoute)
  socket.on('stopSpinner', stopSpinnerRoute)
  socket.on('show',showRoute)
})

function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(_ => {
    emit({channel: 'fileSaved', message: _.fileName})
  })
}

exports.init = () => {
  initWatcher()
  fastify.listen(
    getConfig(_.PORT)
  )
}