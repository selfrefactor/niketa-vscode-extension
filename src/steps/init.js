const fastify = require('fastify')()
const {getConfig} = require('../_helpers/getConfig')
const _ = require('../keys')
const {ok} = require('rambdax')
const {show, tooltip} = require('../bar')
const {getter, setter} = require('../_helpers/internalData')

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

exports.init = () => {
  fastify.listen(
    getConfig(_.PORT)
  )
}