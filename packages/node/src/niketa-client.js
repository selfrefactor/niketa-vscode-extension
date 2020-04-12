import {tryCatch, getter, setter, delay } from 'rambdax'
import { log } from 'helpers-fn'
import {createServer} from 'net'
import { isLintOnlyMode } from './_helpers/isLintOnlyMode'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { fileSaved } from './file-saved'

const SHOULD_DEBUG  = false
let busyFlag = false
let emit

function isWorkFile(filePath){
  return filePath.startsWith(`${ process.env.HOME }/work/`)
}


export class NiketaClient{
  constructor(port) {
    this.port= port
    this.serverInit = false
    this.emit = (x) => console.log(x, 'emit not yet initialized')
  }
  start(){
    if(this.serverInit) return

    const server = createServer(function(socket) {
      log(`Server created`, 'info')
      socket.on('data', (messageFromVSCode) => {
        console.log({messageFromVSCode: messageFromVSCode.toString()})

        const parsedMessage = tryCatch(() => JSON.parse(messageFromVSCode.toString()), false)()
        if(parsedMessage === false){
          return this.onWrongIncomingMessage(messageFromVSCode.toString())
        }
        this.onChangedFile(parsedMessage)
      })
  
      this.emit = (message) => {
        socket.write(JSON.stringify(message));
        socket.pipe(socket);
      }
    });

    log(`Listen at ${ this.port } for vscode`, 'back')
    server.listen(this.port, '127.0.0.1');
  }
  onWrongIncomingMessage(messageFromVSCode){
    console.log({messageFromVSCode})
    return log('Error while parsing messageFromVSCode', 'error')
  }
  async onChangedFile(message){
    console.log({message})
    await delay(2000)
    const testData = [
      {
        fileName: message.filePath,
        logData: {
          1: 'foo',
          5: 'foo1',
          6: 'foo1',
          8: 'foo2',
          9: 'foo3',
        }
      }
    ]
    
    // this.emit({decorations})
  }
}
