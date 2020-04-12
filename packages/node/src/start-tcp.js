import { getter, setter, delay } from 'rambdax'
import { log } from 'helpers-fn'
import {createServer} from 'net'
import { isLintOnlyMode } from './_helpers/isLintOnlyMode'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { fileSaved } from './file-saved'

const SERVER_PORT = 3020
const CLIENT_PORT = 3021
const SHOULD_DEBUG  = false
let busyFlag = false
let emit

function isWorkFile(filePath){
  return filePath.startsWith(`${ process.env.HOME }/work/`)
}

async function testScenario(){
  // const firstFileName
  const testData = [
    {
      // fileName: adjustFileName,
      logData: {
        1: 'foo',
        5: 'foo1',
        6: 'foo1',
        8: 'foo2',
        9: 'foo3',
      }
    }
  ]
}

export function niketaClient(){
  if(getter('INIT')) return

  var server = createServer(function(socket) {
  
    log(`Server created`, 'info')
    setter('DEBUG_LOG', SHOULD_DEBUG)
    setter('INIT', true)
    socket.on('data', (z) => {
      console.log({z: z.toString()})
    })

    emit = ({channel, message}) => {
      delay(2000).then(()=> {
        socket.write(JSON.stringify({channel, message}));
        socket.pipe(socket);
      })
    }
  }); 
  
  log(`Listen at ${ SERVER_PORT } for vscode 1`, 'back')
  server.listen(SERVER_PORT, '127.0.0.1');
}
