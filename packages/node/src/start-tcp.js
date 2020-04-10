import { getter, setter } from 'rambdax'
import { log } from 'helpers-fn'
import {createServer} from 'net'
import { isLintOnlyMode } from './_helpers/isLintOnlyMode'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { fileSaved } from './file-saved'

const SERVER_PORT = 3020
const SHOULD_DEBUG  = false
let busyFlag = false
let emit

function isWorkFile(filePath){
  return filePath.startsWith(`${ process.env.HOME }/work/`)
}

export function niketaClient(){
  var server = createServer(function(socket) {
    if(getter('INIT')) throw new Error('second init')
  
    log(`Server created`, 'info')
    setter('DEBUG_LOG', SHOULD_DEBUG)
    setter('INIT', true)
  
    emit = ({channel, message}) => {
      socket.write(JSON.stringify({channel, message}));
      socket.pipe(socket);
    }
  });
  
  log(`Listen at ${ SERVER_PORT } for vscode 1`, 'back')
  server.listen(SERVER_PORT, '127.0.0.1');
}

