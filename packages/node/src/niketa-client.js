import {pass,tryCatch, getter, setter, delay, remove } from 'rambdax'
import { log } from 'helpers-fn'
import {createServer} from 'net'
import { isLintOnlyMode } from './_helpers/isLintOnlyMode'
import { checkExtensionMessage } from './ants/checkExtensionMessage'
import { getSpecFile } from './utils/get-spec-file.js'
import { cleanJestOutput } from './utils/clean-jest-output.js'
import execa from 'execa'
import { getCoveragePath } from './_modules/getCoveragePath'
import { parseCoverage } from './_modules/parseCoverage'

const JEST_BIN = './node_modules/jest/bin/jest.js'
export const ERROR_ICON = '❌'
export const SUCCESS_ICON = '🐬'
const NO_COVERAGE = 'LINE === undefined'
const SHOULD_DEBUG  = false
let busyFlag = false
let emit

function isWorkFile(filePath){
  return filePath.startsWith(`${ process.env.HOME }/work/`)
}

const defaultEmit = (x) => console.log(x, 'emit not yet initialized')

const messageSchema = {
  disableLint: Boolean,
  withLockedFile: Boolean,
  fileName: String,
  hasWallaby: Boolean,
}

function isMessageCorrect(message){
  const isCorrect = pass(message)(messageSchema)
  if(!isCorrect) {
    log('isMessageCorrect','error')
    return false
  }
  return true
}

function getUncoveredMessage(message){
  if (typeof message !== 'string' || !message){
    return 
  }

  const uncovered = remove('...', message)
  return message.includes('...') ?
    `⛱${ uncovered }` :
    `☔${ uncovered }`
}


export class NiketaClient{
  constructor(port, emit) {
    this.port= port
    this.serverInit = false
    this.emit = emit === undefined ? defaultEmit : emit
    this.lintFileHolder = undefined
    this.fileHolder = undefined
    this.specFileHolder = undefined
  }
  async onJestMessage(message){
    const {disableLint, fileName, hasWallaby, dir} = message

    if(!isMessageCorrect(message))return
    if( isLintOnlyMode(fileName))return this.onLintOnlyMode(fileName)

    const maybeSpecFile = getSpecFile(fileName)
    const {canContinue} = this.markFileForLint({maybeSpecFile, disableLint, hasWallaby, fileName})
    
    if(!canContinue) return
    if(this.stillWaitingForSpec(fileName, dir)) return  
    
    const [failure, execResult, actualFileName, extension] = await this.execJest( { dir, fileName: this.fileHolder, specFileName: this.specFileHolder })
    if(failure) return
    process.stderr.write(execResult.stderr + '\n\n')
    process.stderr.write(execResult.stdout + '\n\n')

    this.sendToVSCode({execResult, actualFileName, fileName: this.fileHolder, extension})
    return true
  }
  sendToVSCode({execResult, actualFileName, fileName, extension}) {
    const hasError =
    execResult.stderr.startsWith('FAIL') ||
    execResult.stderr.includes('ERROR:')
    if (hasError){
      return this.emit({firstBarMessage: ERROR_ICON, hasDecorations: false})
    }

    const { pass, message, uncovered } = parseCoverage({
      execResult,
      actualFileName,
      fileName,
      extension
  })
    const newDecorations = this.getNewDecorations({execResult, actualFileName, fileName})
    const firstBarMessage = pass ? message : ERROR_ICON
    const secondBarMessage = getUncoveredMessage(uncovered)

    this.emit({firstBarMessage, secondBarMessage, hasDecorations: false})  
  }
  getNewDecorations({execResult, actualFileName, fileName}){
    const input = cleanJestOutput(execResult.stdout)
    const [consoleLogsRaw] = input.split('----------------------|')
    console.log({consoleLogsRaw})
  }
  async execJest({fileName, dir, specFileName}){
    try {
      const [ coveragePath,actualFileName, extension ] = getCoveragePath(dir, fileName)
      const testPattern = `-- ${ specFileName }`
    
      const command = [
        JEST_BIN,
        '-u',
        '--maxWorkers=1',
        '--env=node',
        '--collectCoverage=true',
        coveragePath,
        testPattern
      ].join(' ')
      this.jestChild = execa.command(command, {cwd: dir});
      const result = await this.jestChild
      this.jestChild = undefined
      return [false, result, actualFileName, extension]
    }catch(e){
        console.log(this.jestChild.killed); // true
        console.log(e.isCanceled);
      this.logError(e, 'execJest')
      return [true]
    }
  }
  logError(e,label){
    console.log({
      e,
      label
    })
  }
  stillWaitingForSpec(fileName, dir){
    const stillWating = !(this.fileHolder && this.specFileHolder)
    const specBelongs = this.fileHolder.startsWith(dir)
    if(stillWating){
      // This happens only until the script receives a correct filepath
      this.debugLog('no specfile', fileName)
      return true
    }
    if (!specBelongs){
      // when we have filepath from previous project but not in the current
  
      this.debugLog(dir, 'still waiting for testable file in this project')
      return true
    }  
    return false
  }
  onLintOnlyMode(fileName){
    console.log('onLintOnlyMode', fileName)  
  }
  markFileForLint({disableLint, fileName, hasWallaby, maybeSpecFile}){
    if(disableLint) return {canContinue:true}

    const allowLint = fileName !== this.lintFileHolder && this.lintFileHolder !== undefined

    if (allowLint){
      log(`LINT ${ this.lintFileHolder }`, 'box')
      // whenFileLoseFocus(lintFileHolder, disableLint)
      this.lintFileHolder = fileName
    }else {
      log(`SKIP_LINT ${ this.lintFileHolder ? this.lintFileHolder : 'initial state' }`, 'box')
    }

    if (hasWallaby){
      this.lintFileHolder = fileName
  
      this.debugLog(fileName, 'saved for lint later')
      return {canContinue: false}
    }

    if (maybeSpecFile){
      this.fileHolder = fileName
      this.lintFileHolder = fileName
      this.specFileHolder = maybeSpecFile
      this.debugLog(fileName, 'saved for lint later')
      return {canContinue: true}
    } 
    this.debugLog(fileName, 'saved for lint later even without spec')
  
      // Even if the file has no corresponding spec file
      // we keep it for further linting
      this.lintFileHolder = fileName

    return {canContinue: false}
  }
  debugLog(data, label){

  }
  async onMessageTest(message){
    console.log({message})
    await delay(4000)
    const testUnreliableData = {
      correct: false,
      logData: [ 'foo', 'foo1', 'foo2', 'foo3' ],
    }

    const newDecorations = 
      {
        correct: true,
        logData: {
          1: 'foo',
          5: 'foo1',
          6: 'foo1',
          8: 'foo2',
          9: 'foo3',
        }
      }
    console.log('sending message')  
    this.emit({newDecorations:testUnreliableData, firstStatusBar: 'Keep it up'})
  }
  onCancelMessage({fileName}){
    console.log('in cancel message', fileName)
    if(!this.jestChild) return
    if(!this.jestChild.cancel) return

    this.jestChild.cancel()
    this.jestChild = undefined
  }
  async onSocketData(messageFromVSCode){
    console.log({messageFromVS: messageFromVSCode.toString()})

    const parsedMessage = tryCatch(() => JSON.parse(messageFromVSCode.toString()), false)()
    console.log({parsedMessage})
    if(parsedMessage === false){
      return this.onWrongIncomingMessage(messageFromVSCode.toString())
    } 
    if(parsedMessage.requestCancelation){
      return this.onCancelMessage(parsedMessage)
    }
    console.log(1)
    const result = await this.onJestMessage(parsedMessage)
    return result
  }
  start(){
    if(this.serverInit) return
    this.server = createServer(socket => {
      log(`Server created`, 'info')
      socket.on('data', data => this.onSocketData(data.toString()))
      
      this.emit = (message) => {
        socket.write(JSON.stringify(message));
        socket.pipe(socket);
      }
      this.serverInit = true
    });

    log(`Listen at ${ this.port } for vscode`, 'back')
    this.server.listen(this.port, '127.0.0.1');
  }
  onWrongIncomingMessage(messageFromVSCode){
    console.log({messageFromVSCode})
    return log('Error while parsing messageFromVSCode', 'error')
  }
}

// const niketaClient = new NiketaClient(3020)
// niketaClient.start()