const { niketaConfig } = require('./niketaConfig')
const socket = require(
  'socket.io-client'
)(`http://localhost:${ niketaConfig('PORT_1') }`)

const { ok, omit } = require('rambdax')

const initEmitter = () => {
  socket.on('connect', () => {
    console.log('connected', niketaConfig('PORT_1'))
  })
}

const emit = input => {
  ok(input)({ channel : 'string' })

  socket.emit(
    input.channel,
    { message : omit('channel', input) }
  )
}

exports.initEmitter = initEmitter
exports.emit = emit
