const { niketaConfig } = require('./niketaConfig')

const socket = require(
  'socket.io-client'
)(`http://localhost:${ niketaConfig('PORT_1') }`)
const DISABLE_LINT = niketaConfig('DISABLE_LINT')
const { ok } = require('rambdax')

const initEmitter = () => {
  socket.on('connect', () => {
    console.log('connected', niketaConfig('PORT_1'))
  })
}

const emit = input => {
  ok(input)({ channel : 'string' })

  socket.emit(
    input.channel,
    { message : {...input, disableLint: DISABLE_LINT} }
  )
}

exports.initEmitter = initEmitter
exports.emit = emit
