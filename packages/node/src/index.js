import { conf } from './_modules/conf'
conf()
import fastify from 'fastify'
import socketClient from 'socket.io-client'
import socketServer from 'socket.io'
import { fileSaved } from './fileSaved'
import { clean } from './_helpers/clean'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { identity, setter } from 'rambdax'
import WebSocket from 'ws'

let busyFlag = false
let notify = identity
let notifyClose
let emit

function parseBeforeNotify(input){
  const toReturn = input.split('\n').map(clean)
    .join('\n')

  return toReturn
}

const wss = new WebSocket.Server({ port : conf('PORT_2') })

wss.on('connection', ws => {
  notify = text => {
    if (typeof text !== 'string') return

    return ws.send(parseBeforeNotify(text))
  }
})

function catchFn(e){
  console.log(e, 'catchFn')
  busyFlag = false
}

export function niketaClient(){
  const app = fastify()
  app.listen(conf('PORT_1'))

  const io = socketServer(app.server)
  const socket = socketClient(`http://localhost:${ conf('PORT_0') }`)
  const socketNotifyClose = socketClient(`http://localhost:${ conf('PORT_3') }`)

  socketNotifyClose.on('connect', () => {
    console.log('connected', conf('PORT_3'))
    setter('electron.connected', true)

    notifyClose = () => {
      socketNotifyClose.emit(
        'rabbit',
        { message : 'hole' }
      )
    }
  })

  socket.on('connect', () => {
    console.log('connected notify', conf('PORT_0'))
    emit = input => {
      socket.emit(input.channel, { message : input.message })
    }
  })

  io.on('connection', socketInstance => {
    console.log('connected', conf('PORT_1'))

    socketInstance.on('fileSaved', input => {
      if (busyFlag) return console.log('BUSY')

      const passed = checkExtensionMessage(input.message)

      if (!passed) return console.log('unknown mode', input.message)

      busyFlag = true

      const options = {
        disableLint : Boolean(input.message.disableLint),
        lintOnly    : input.message.mode === 'LINT_ONLY',
        dir         : input.message.dir,
        emit,
        notify,
        notifyClose,
        filePath    : input.message.filePath,
        hasReact    : input.message.hasReact,
      }

      fileSaved(options)
        .then(() => busyFlag = false)
        .catch(catchFn)
    })
  })
}
