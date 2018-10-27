const {ok} = require('rambdax')
const socket = require('socket.io-client')('http://localhost:3012')

const initEmitter = () => {
  socket.on('connect', () => {
    console.log('connected');
  })
}

const emit = input => {
  ok(input)({channel: 'string', message: 'string'})
  
  socket.emit(input.channel, { message: input.message });
}

exports.initEmitter = initEmitter
exports.emit = emit
// socket.on('event', console.log);
// socket.on('disconnect', function(){});