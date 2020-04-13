const {
  workspace,
  window,
  Range,
  Position,
  StatusBarAlignment,
} = require('vscode')
const { CHANGE_MODE } = require('./constants')
const { delay, mapAsync, range, path, getter, tryCatch } = require('rambdax')
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
        console.log('Received: ' + data)
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
const BAR_LENGTH = 3
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
    this.firstStatusBar = undefined
    this.secondStatusBar = undefined
    this.thirdStatusBar = undefined
  }

  lock(){
    if (this.lockFlag) return
    this.lockFlag = true
  }

  unlock(){
    if (!this.lockFlag) return
    this.lockFlag = false
  }
  onWrongIncomingMessage(message){
    console.error(message,'onWrongIncomingMessage')
  }
  async paintDecorations(pendingDecorations){
    await delay(50)
    const editor = this.getEditor()

    editor.setDecorations(this.decorationType, pendingDecorations)
  }
  setterDecorations(){

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
  async onCorrectDecorations({correct, logData}){
    if(!correct) return
    if(Object.keys(logData).length === 0) return
    const pendingDecorations = this.buildCorrectDecorations(logData)

    await this.paintDecorations(pendingDecorations)
    await delay(200)
    this.unlock()
  }
  async onUnreliableDecorations(message){
    console.log(message)
  }
  messageReceived(messageFromServer, starterFileName){
    const parsedMessage = tryCatch(() => JSON.parse(messageFromServer.toString()), false)()
    if(!parsedMessage) return this.unlock()
    if(!parsedMessage.newDecorations) return this.unlock()

    if(parsedMessage.newDecorations.correct === true){
      return this.onCorrectDecorations(
        parsedMessage.newDecorations
      )
    }
    if(parsedMessage.newDecorations.correct === false){
      this.unlock()
      return this.onUnreliableDecorations(parsedMessage.newDecorations)
    } 
    this.unlock()
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
    this.firstStatusBar.command = CHANGE_MODE
  
    bars.forEach(x => {
      const currentBar = this[x]

      currentBar.show()
      currentBar.text = `INIT_${x}`
      
      delay(3200).then(() => {
        currentBar.text = ''
      })
    })
  }
  loadLogData(newLogData){
    // this.logData = {
    //   ...this.logData,
    //   ...newLogData
    // }
  }

  loadUnreliableData(list, fileName){
    // this.logData = {
    //   ...this.logData,
    //   [fileName]: {}
    // }
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

  handleError(error, label = ''){
    console.log(
      'Received error:', error, label
    )
  }

  partialResetDecorations(fileName){}
  getEditor(){
    const [ editor ] = window.visibleTextEditors
    if (!editor) throw new Error('!editor')

    return editor
  }

  refreshDecorations(fileName){
    clearTimeout(this.timeoutHolder)

    this.timeoutHolder = setTimeout(this.work(this.getEditor(), fileName),
      this.options.ms)
  }

  work(editor, fileName){
    return () => {
      try {
        const newDecorations = Object.keys(this.decorations[ fileName ]).map(x => this.decorations[ fileName ][ x ])
        editor.setDecorations(this.decorationType, newDecorations)
      } catch (error){
        this.handleError(error, 'work')
      }
    }
  }
}

const adjustFileName = '/home/s/repos/rambda/source/adjust.js'
const specFileName = '/home/s/repos/rambda/source/adjust.spec.js'

const testData = [
  {
    fileName : adjustFileName,
    logData  : {
      1 : 'foo',
      5 : 'foo1',
      6 : 'foo1',
      8 : 'foo2',
      9 : 'foo3',
    },
  },
  {
    fileName : specFileName,
    logData  : {
      3 : 'bat',
      4 : 'foo1',
      5 : 'foo2',
    },
  },
]
const testUnreliableData = [ 'foo', 'foo1', 'foo2', 'foo3' ]

let logData = []
let unreliableLogData = []

function loadLogData(newLogData){
  logData = newLogData.slice()
}
function loadUnreliableData(newLogData){
  unreliableLogData = newLogData.slice()
}

function logIsEmpty(){
  return logData.length === 0
}
function unreliableLogIsEmpty(){
  return unreliableLogData.length === 0
}

function decorateWithLogData(fileName){
  try {
    // if(logIsEmpty()) return
    // const currentLog = logData.find(x => x.fileName === fileName)
    // if(currentLog === undefined){
    //   return console.log('no log data for file', fileName)
    // }
    // decorations[fileName] = {}
    // const iteratable = (testDataKey => {
    //   const line = Number(testDataKey)
    //   const toShow = currentLog.logData[testDataKey]
    //   const decoration = {
    //     renderOptions: {after: {contentText: toShow, color}},
    //     range: new Range(new Position(line - 1, 1024), new Position(line - 1, 1024))
    //   };
    //   decorations[fileName][testDataKey] = decoration
    // })
    // Object.keys(currentLog.logData).map(iteratable)
    // refreshDecorations(fileName);
  } catch (error){
    console.log(error)
  }
}

function findLinesInFocus(){
  try {
    const [ editor ] = window.visibleTextEditors
    if (!editor) return
    const [ visibleRange ] = editor.visibleRanges
    const startLine = path('_start.line', visibleRange)
    const endLine = path('_end.line', visibleRange)

    return {
      startLine,
      endLine,
    }
  } catch (error){
    console.log(error)
  }
}
/*

async function logUnreliableData(fileName){
  try {
    if(unreliableLogIsEmpty()) return
    const {startLine,endLine} = await findLinesInFocus()
    const currentLog = unreliableLogData.slice()
    decorations[fileName] = {}
    const linesToUse = endLine - startLine - TOP_MARGIN
    const len = currentLog.length

    const endPoint = len < linesToUse ? startLine + len + TOP_MARGIN : endLine

    const iteratable = ((lineNumber,i) => {
      const toShow = currentLog[i]
      const decoration = {
        renderOptions: {after: {contentText: toShow, color}},
        range: new Range(new Position(lineNumber - 1, 1024), new Position(lineNumber - 1, 1024))
      };

      decorations[fileName][lineNumber] = decoration
    })
    const loop = range(startLine+TOP_MARGIN, endPoint)
    loop.map(iteratable)

    refreshDecorations(fileName);
  } catch (error) {
    console.log(error)
  }
}
*/

const worker = new Worker()

function initExtension(){
  workspace.onDidSaveTextDocument(e => {
    if (worker.lockFlag) return
    worker.lock()
    const messageToSend = {
      fileName : e.fileName,
      mode     : getter('MODE'),
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
