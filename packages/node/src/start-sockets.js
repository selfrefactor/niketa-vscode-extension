import { conf } from './_modules/conf'
conf()

import { setter } from 'rambdax'
const VSCODE_INPUT_LOG = false
setter('DEBUG_LOG', false)

import fastify from 'fastify'
import { log } from 'helpers-fn'
import socketServer from 'socket.io'
import socketClient from 'socket.io-client'

import { isLintOnlyMode } from './_helpers/isLintOnlyMode'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { fileSaved } from './file-saved'

let busyFlag = false
let emit

function catchFn(e){
  log('sep')
  log('sep')
  console.log(e, 'catchFn')
  busyFlag = false
  log('sep')
  log('sep')
}

function isWorkFile(filePath){
  return filePath.startsWith(`${ process.env.HOME }/work/`)
}

export function niketaClient(){
  log(`Listen at ${ conf('PORT_1') } for vscode 2`, 'back')
  const app = fastify()
  app.listen(conf('PORT_1'))
  const io = socketServer(app.server)

  log(`Listen at ${ conf('PORT_0') } for vscode 1`, 'icon.tag=bar')
  const socket = socketClient(`http://localhost:${ conf('PORT_0') }`)

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
        console.log(input)

        return log('unknown VSCode message error', 'box')
      }

      if (!emit){
        return console.log('Waiting for VSCode to connect', input.message)
      }

      busyFlag = true

      const options = {
        disableLint  : isWorkFile(input.message.filePath),
        lintOnly     : input.message.mode === 'LINT_ONLY',
        dir          : input.message.dir,
        emit,
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
