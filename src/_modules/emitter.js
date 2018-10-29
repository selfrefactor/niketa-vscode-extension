const socket = require('socket.io-client')('http://localhost:3012')
const { ok, omit } = require('rambdax')

const initEmitter = () => {
  socket.on('connect', () => {
    console.log('connected 3012')
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
