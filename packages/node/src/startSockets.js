const DEBUG = false

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
console.log(`Listen at ${conf('PORT_2')} for electron notify`)

wss.on('connection', ws => {
  console.log(`Connected at ${conf('PORT_2')} for electron notify`)

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
  console.log(`Listen at ${conf('PORT_1')} for vscode 2`)
  app.listen(conf('PORT_1'))  
  
  const io = socketServer(app.server)
  console.log(`Listen at ${conf('PORT_0')} for vscode 1`)
  const socket = socketClient(`http://localhost:${ conf('PORT_0') }`)
  console.log(`Listen at ${conf('PORT_3')} for electron notify close`)
  const socketNotifyClose = socketClient(`http://localhost:${ conf('PORT_3') }`)

  socketNotifyClose.on('connect', () => {
    console.log('connected notify close', conf('PORT_3'))
    setter('electron.connected', true)

    notifyClose = () => {
      socketNotifyClose.emit(
        'rabbit',
        { message : 'hole' }
      )
    }
  })

  socket.on('connect', () => {
    console.log('connected vscode 1', conf('PORT_0'))
    emit = input => {
      socket.emit(input.channel, { message : input.message })
    }
  })

  io.on('connection', socketInstance => {
    console.log('connected vscode 2', conf('PORT_1'))

    socketInstance.on('fileSaved', input => {
      if (busyFlag) return console.log('BUSY')

      const passed = checkExtensionMessage(input.message)

      if (!passed) return console.log('unknown mode', input.message)
      if (!emit) return console.log('Waiting for VSCode to connecte', input.message)
      busyFlag = true

      const options = {
        debugFlag: DEBUG,
        disableLint : Boolean(input.message.disableLint),
        lintOnly    : input.message.mode === 'LINT_ONLY',
        dir         : input.message.dir,
        emit,
        notify,
        notifyClose,
        filePath    : input.message.filePath,
        hasReact    : input.message.hasReact,
        hasAngular    : input.message.hasAngular,
      }
      console.log({options, input, emit})

      fileSaved(options)
        .then(() => busyFlag = false)
        .catch(catchFn)
    })
  })
}