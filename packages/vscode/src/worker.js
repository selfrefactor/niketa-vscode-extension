const {
  workspace,
  window,
  env,
  Range,
  Position,
  StatusBarAlignment,
} = require('vscode')
const { REQUEST_CANCELATION } = require('./constants')
const { delay, mapAsync, range, path, getter, tryCatch, ok } = require('rambdax')
const { existsSync } = require('fs')
const { Socket } = require('net')

const CLIENT_PORT = 3020

function sendMessage(messageToSend){
  return new Promise((resolve, reject) => {
    try {
      const client = new Socket()
      client.connect(
        CLIENT_PORT, '127.0.0.1', () => {
          console.log('Connected')
          client.write(JSON.stringify(messageToSend))
        }
      )

      client.on('data', data => {
        client.destroy() // kill client after server's response
        return resolve(data)
      })

      client.on('close', () => {
        console.log('Connection closed')

        return resolve(false)
      })
    } catch (error){
      return reject(error)
    }
  })
}

const defaultValues = {
  TOP_MARGIN : 3,
  color      : '#7cc36e',
  ms         : 100,
}
const PRIORITY = 200

class Worker{
  constructor(userOptions = {}){
    this.lockFlag = false
    this.options = {
      ...defaultValues,
      ...userOptions,
    }
    this.decorationType = window.createTextEditorDecorationType({ after : { margin : '0 0 0 1rem' } })
    this.timeoutHolder = undefined
    this.decorations = {}
    this.filesWithDecorations = []
    this.logData = {}
    this.emit = x => {
      console.log(x, 'emit is not yet initialized')
    }
    this.dir = env.appRoot
    this.hasWallaby = undefined
    this.firstStatusBar = undefined
    this.secondStatusBar = undefined
    this.thirdStatusBar = undefined
  }

  isLocked(){
    return this.lockFlag === true
  }
  lock(){
    if (this.lockFlag) return
    this.lockFlag = true
  }
  unlock(){
    if (!this.lockFlag) return
    this.lockFlag = false
  }
  init(){
    this.hasWallaby = existsSync(
      `${this.dir}/wallaby.js`
    )
  }
  getCalculated(){
    return {
      hasWallaby: this.hasWallaby,
      disableLint: false,
      withLockedFile: false,
      dir: this.dir
    }
  }
  onWrongIncomingMessage(message){
    console.error(message,'onWrongIncomingMessage')
  }
  clearDecorations() {
    window.visibleTextEditors.forEach(textEditor => {
      return textEditor.setDecorations(this.decorationType, []);
    });
  }
  async paintDecorations(pendingDecorations){
    await delay(50)
    const editor = this.getEditor()

    editor.setDecorations(this.decorationType, pendingDecorations)
  }
  buildCorrectDecorations(logData){
    const pendingDecorations = []
    const iteratable = (lineKey => {
      const line = Number(lineKey)
      const toShow = logData[lineKey]
      const decoration = {
        renderOptions: {after: {contentText: toShow, color: '#7cc36e'}},
        range: new Range(new Position(line - 1, 1024), new Position(line - 1, 1024))
      };
      pendingDecorations.push(decoration)
    })
  
    Object.keys(logData).map(iteratable)
    return pendingDecorations  
  }
  buildUnreliableDecorations({logData, endLine, startLine}){
    const TOP_MARGIN = 3
    const linesToUse = endLine - startLine - TOP_MARGIN
    const len = logData.length

    const endPoint = len < linesToUse ? startLine + len + TOP_MARGIN : endLine

    const iteratable = ((lineNumber,i) => {
      const toShow = logData[i]
      const decoration = {
        renderOptions: {after: {contentText: toShow, color: '#7cc36e'}},
        range: new Range(new Position(lineNumber - 1, 1024), new Position(lineNumber - 1, 1024))
      };
      return decoration
    })
    const loop = range(startLine+TOP_MARGIN, endPoint)
    return loop.map(iteratable)
  }
  async onCorrectDecorations({correct, logData}){
    if(!correct) return
    if(Object.keys(logData).length === 0) return
    const pendingDecorations = this.buildCorrectDecorations(logData)

    await this.paintDecorations(pendingDecorations)
    await delay(200)
    this.unlock()
  }
  async onUnreliableDecorations({correct, logData}){
    if(correct) return
    ok(logData)([String])
    const {startLine,endLine} = await this.findLinesInFocus()
    const pendingDecorations = this.buildUnreliableDecorations({logData, startLine, endLine})
    await this.paintDecorations(pendingDecorations)
    await delay(200)
    this.unlock()
  }
  messageReceived(messageFromServer, starterFileName){
    const parsedMessage = tryCatch(() => JSON.parse(messageFromServer.toString()), false)()
    if(!parsedMessage) return this.unlock()
    if(parsedMessage.hasDecorations === false) return this.whenNoDecorations(parsedMessage)
    if(!parsedMessage.newDecorations) return this.unlock()

    if(parsedMessage.newDecorations.correct === true){
      return this.onCorrectDecorations(
        parsedMessage.newDecorations
      )
    }
    if(parsedMessage.newDecorations.correct === false){
      return this.onUnreliableDecorations(parsedMessage.newDecorations)
    } 
    this.unlock()
  }
  whenNoDecorations({firstBarMessage}){
    this.setterStatusBar({newText: firstBarMessage, statusBarIndex:0})  
  }
  setterStatusBar({newText, statusBarIndex}){
    if(![0,1,2].includes(statusBarIndex)) return
    const indexToProperty = [
      'firstStatusBar',
      'secondStatusBar',
      'thirdStatusBar'
    ]
    const selectedStatusBar = this[indexToProperty[statusBarIndex]]
    if(!selectedStatusBar) return

    selectedStatusBar.text = newText
  }
  initStatusBars(){
    this.firstStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,
      PRIORITY)
    this.secondStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,
      PRIORITY + 1)
    this.thirdStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,
      PRIORITY + 2)

    const bars = [ 'firstStatusBar', 'secondStatusBar', 'thirdStatusBar' ]
    this.firstStatusBar.command = REQUEST_CANCELATION
  
    bars.forEach((x, i) => {
      const currentBar = this[x]

      currentBar.show()
      currentBar.text = `INIT_${x}`
      if(i === 0) return
      delay(3200).then(() => {
        currentBar.text = ''
      })
    })
  }
  findLinesInFocus(){
    try {
      const [ visibleRange ] = this.getEditor().visibleRanges
      const startLine = path('_start.line', visibleRange)
      const endLine = path('_end.line', visibleRange)

      return {
        startLine,
        endLine,
      }
    } catch (error){
      this.handleError(error)
    }
  }
  requestCancelation(){
    console.log({a:1})
  }
  handleError(error, label = ''){
    console.log(
      'Received error:', error, label
    )
  }
  getEditor(){
    const [ editor ] = window.visibleTextEditors
    if (!editor) throw new Error('!editor')

    return editor
  }
}

const worker = new Worker()

function initExtension(){
  workspace.onDidSaveTextDocument(e => {
    if (worker.isLocked()) return
    worker.lock()
    const messageToSend = {
      fileName : e.fileName,
      ...worker.getCalculated()
    }

    sendMessage(messageToSend)
      .then(messageFromServer =>
        worker.messageReceived(
          messageFromServer,
          e.fileName
        ))
      .catch(e => {
        console.log(e, 'initExtension')
        worker.unlock()
      })
  })
}

exports.initExtension = () => {
  initExtension()
  return worker
}  
