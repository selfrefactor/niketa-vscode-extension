const fastify = require('fastify')()
const {getConfig} = require('../_helpers/getConfig')
const {ACTIVE_FLAG} = require('../keys')
const {show, tooltip} = require('../bar')
const {getter, setter} = require('../_helpers/internalData')

fastify.get('/show', async request => {
  if(!getter(ACTIVE_FLAG)) return { ok: false }
  
  console.log(request)
  show('FOO')
  return { ok: true }
})

const start = async () => {
  try {
    await fastify.listen(
      getConfig('port')
    )
  } catch (err) {
    console.error(err)
  }
}

function init(){
  start()
}

exports.init = init
