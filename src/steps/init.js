const vscode = require('vscode')
const fastify = require('fastify')()
const {getConfig} = require('../_helpers/getConfig')
const _ = require('../keys')
const {ok} = require('rambdax')
const {show, tooltip} = require('../bar')
const {getter, setter} = require('../_helpers/internalData')
const {emit} = require('../_modules/emitter')

const io = require('socket.io')(fastify.server);

function showRoute(request){
  if(!getter(_.ACTIVE_FLAG)) return
  
  ok(request)({message: 'string'})
  show(request.message)
}

function replyRoute(request){
  console.log({request,a:1})
}

io.on(_.CONNECTION, socket => {
  socket.on(_.SHOW,showRoute)
  socket.on(_.REPLY,replyRoute)
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