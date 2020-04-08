import { conf } from './_modules/conf'
conf()

import { identity, setter } from 'rambdax'
const VSCODE_INPUT_LOG = false
setter('DEBUG_LOG', false)

import fastify from 'fastify'
import { log } from 'helpers-fn'
import socketServer from 'socket.io'
import socketClient from 'socket.io-client'
import WebSocket from 'ws'

import { debugLog } from './_helpers/debugLog'
import { isLintOnlyMode } from './_helpers/isLintOnlyMode'
import { parseBeforeNotify } from './_modules/parseBeforeNotify'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { fileSaved } from './fileSaved'

let busyFlag = false
let notify = identity
let notifyClose
let emit

const wss = new WebSocket.Server({ port : conf('PORT_2') })
log(`Listen at ${ conf('PORT_2') } for electron notify`, 'info')

wss.on('connection', ws => {
  log(`Connected at ${ conf('PORT_2') } for electron notify`, 'info')

  notify = text => {
    if (typeof text !== 'string') return
    const toSend = parseBeforeNotify(text)

    debugLog(toSend, 'before send to electron')

    return ws.send(toSend)
  }
})

function catchFn(e){
  log('sep')
  log('sep')
  console.log(e, 'catchFn')
  busyFlag = false
  log('sep')
  log('sep')
}

function isWorkFile(filePath){
  return filePath.startsWith(`${process.env.HOME}/work/`)
}

export function niketaClient(){
  const app = fastify()
  log(`Listen at ${ conf('PORT_1') } for vscode 2`, 'back')
  app.listen(conf('PORT_1'))

  const io = socketServer(app.server)
  log(`Listen at ${ conf('PORT_0') } for vscode 1`, 'icon.tag=bar')

  const socket = socketClient(`http://localhost:${ conf('PORT_0') }`)
  log(`Listen at ${ conf('PORT_3') } for electron notify close`, 'box')

  const socketNotifyClose = socketClient(`http://localhost:${ conf('PORT_3') }`)

  socketNotifyClose.on('connect', () => {
    log(`connected notify close ${ conf('PORT_3') }`, 'box')
    setter('electron.connected', true)

    notifyClose = () => {
      socketNotifyClose.emit('rabbit', { message : 'hole' })
    }
  })

  socket.on('connect', () => {
    log(`connected vscode 1 ${ conf('PORT_0') }`, 'icon.tag=bar')
    emit = input => {
      socket.emit(input.channel, { message : input.message })
    }
  })

  io.on('connection', socketInstance => {
    log(`connected vscode 2 ${ conf('PORT_1') }`, 'back')

    socketInstance.on('fileSaved', input => {
      if (busyFlag) return console.log('BUSY')

      const passed = checkExtensionMessage(input.message)

      if (!passed){
        console.log(input.message)

        return log('unknown VSCode message error', 'box')
      }

      if (!emit){
        return console.log('Waiting for VSCode to connecte', input.message)
      }

      busyFlag = true

      const options = {
        disableLint  : isWorkFile(input.message.filePath),
        lintOnly     : input.message.mode === 'LINT_ONLY',
        dir          : input.message.dir,
        emit,
        notify,
        notifyClose,
        filePath     : input.message.filePath,
        hasWallaby   : input.message.hasWallaby,
        lintOnlyMode : isLintOnlyMode(input.message.filePath),
      }
      if (VSCODE_INPUT_LOG){
        console.log({
          options,
          input,
          emit,
        })
      }

      fileSaved(options)
        .then(() => busyFlag = false)
        .catch(catchFn)
    })
  })
}
