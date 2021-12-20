const {
  workspace,
  window,
  Range,
  Position,
  StatusBarAlignment,
} = require('vscode')
const { delay, range, path, tryCatch, ok } = require('rambdax')
const { existsSync } = require('fs')
const { niketaConfig } = require('./utils/niketa-config.js')
const { REQUEST_LINT_FILE, REQUEST_TEST_RUN } = require('./constants')
const { Socket } = require('net')

const CLIENT_PORT = niketaConfig('PORT')
const SMALL_DELAY = 15

const defaultValues = {
  TOP_MARGIN : 3,
  color      : '#7cc36e',
  ms         : 100,
}
const PRIORITY = 200

function sendMessage(messageToSend){
  return new Promise((resolve, reject) => {
    try {
      const client = new Socket()
      client.connect(
        CLIENT_PORT, '127.0.0.1', () => {
          client.write(JSON.stringify(messageToSend))
        }
      )

      client.on('data', data => {
        client.destroy()

        return resolve(data)
      })

      client.on('close', () => {
        return resolve(false)
      })
    } catch (error){
      return reject(error)
    }
  })
}

class Worker{
  constructor(userOptions = {}){
    this.lockFlag = false
    this.options = {
      ...defaultValues,
      ...userOptions,
    }
    this.decorationType = window.createTextEditorDecorationType({ after : { margin : '0 0 0 1rem' } })
    this.decorations = {}
    this.filesWithDecorations = []
    this.emit = x => {
      console.log(x, 'emit is not yet initialized')
    }
    this.dir = workspace.workspaceFolders[ 0 ].uri.path
    this.loc = undefined
    this.latestFilePath = undefined
    this.firstStatusBar = undefined
    this.secondStatusBar = undefined
    this.thirdStatusBar = undefined
  }

  isLocked(){
    return this.lockFlag === true
  }
  lock(loc){
    if (this.lockFlag) return

    this.lockFlag = true

    if (loc) this.loc = loc

    this.startLoading()
  }

  unlock(){
    if (!this.lockFlag) return
    this.lockFlag = false
  }

  init(){
    this.hasTypescript = existsSync(`${ this.dir }/tsconfig.json`)
  }

  setLatestFile(filePath){
    this.latestFilePath = filePath
  }

  startLoading(){
    this.setterStatusBar({
      newText        : 'Loading ...',
      statusBarIndex : 0,
    })

    if (this.thirdStatusBar.text){
      this.setterStatusBar({
        newText        : '',
        statusBarIndex : 1,
      })
      this.setterStatusBar({
        newText        : '',
        statusBarIndex : 2,
      })
    }
  }

  getCalculated(){
    return {
      hasTypescript : this.hasTypescript,
      dir           : this.dir,
    }
  }

  onWrongIncomingMessage(message){
    console.error(message, 'onWrongIncomingMessage')
  }

  async paintDecorations(pendingDecorations){
    await delay(50)
    const editor = this.getEditor()

    editor.setDecorations(this.decorationType, pendingDecorations)
  }

  buildCorrectDecorations(logData, loc){
    const pendingDecorations = []
    const iteratable = lineKey => {
      const line = Number(lineKey)
      if (line + 1 >= loc) return
      const toShow = logData[ lineKey ]
      const decoration = {
        renderOptions : {
          after : {
            contentText : toShow,
            color       : '#7cc36e',
          },
        },
        range : new Range(new Position(line - 1, 1024),
          new Position(line - 1, 1024)),
      }
      pendingDecorations.push(decoration)
    }

    Object.keys(logData).map(iteratable)

    return pendingDecorations
  }

  buildUnreliableDecorations({ logData, endLine, startLine }){
    const TOP_MARGIN = 3
    const linesToUse = endLine - startLine - TOP_MARGIN
    const len = logData.length

    const endPoint =
      len < linesToUse ? startLine + len + TOP_MARGIN : endLine

    const iteratable = (lineNumber, i) => {
      const toShow = logData[ i ]
      const decoration = {
        renderOptions : {
          after : {
            contentText : toShow,
            color       : '#7cc36e',
          },
        },
        range : new Range(new Position(lineNumber - 1, 1024),
          new Position(lineNumber - 1, 1024)),
      }

      return decoration
    }
    const loop = range(startLine + TOP_MARGIN, endPoint)

    return loop.map(iteratable)
  }

  async onCorrectDecorations(newDecorations, loc){
    const { correct, logData } = newDecorations
    if (!correct) return
    if (Object.keys(logData).length === 0) return

    const pendingDecorations = this.buildCorrectDecorations(logData, loc)
    await this.paintDecorations(pendingDecorations)

    await delay(200)
    this.unlock()
  }

  async onUnreliableDecorations({ correct, logData }){
    if (correct) return
    ok(logData)([ String ])

    const { startLine, endLine } = await this.findLinesInFocus()
    const pendingDecorations = this.buildUnreliableDecorations({
      logData,
      startLine,
      endLine,
    })
    await this.paintDecorations(pendingDecorations)

    await delay(200)
    this.unlock()
  }

  async updateStatusBars({
    firstBarMessage,
    secondBarMessage,
    thirdBarMessage,
  }){
    const messages =
      firstBarMessage === '' ?
        [ ' ', ' ', ' ' ] :
        [ firstBarMessage, secondBarMessage, thirdBarMessage ]

    await delay(SMALL_DELAY)
    this.setterStatusBar({
      newText        : messages[ 0 ],
      statusBarIndex : 0,
    })

    await delay(SMALL_DELAY)
    if (messages[ 1 ]){
      this.setterStatusBar({
        newText        : messages[ 1 ],
        statusBarIndex : 1,
      })
    }
    await delay(SMALL_DELAY)
    if (messages[ 2 ]){
      this.setterStatusBar({
        newText        : messages[ 2 ],
        statusBarIndex : 2,
      })
    }
  }

  messageReceived(messageFromServer){
    const parse = () => JSON.parse(messageFromServer.toString())
    const parsedMessage = tryCatch(parse, false)()
    if (!parsedMessage) return this.unlock()

    const {
      hasDecorations,
      newDecorations,
      firstBarMessage,
      secondBarMessage,
      thirdBarMessage,
    } = parsedMessage

    this.updateStatusBars({
      firstBarMessage,
      secondBarMessage,
      thirdBarMessage,
    })
    if (hasDecorations === false) return this.clearDecorations()

    if (newDecorations.correct === true){
      return this.onCorrectDecorations(newDecorations, this.loc)
    }

    if (newDecorations.correct === false){
      return this.onUnreliableDecorations(newDecorations)
    }

    this.unlock()
  }

  clearDecorations(){
    this.unlock()

    window.visibleTextEditors.forEach(textEditor =>
      textEditor.setDecorations(this.decorationType, []))
  }

  setterStatusBar({ newText, statusBarIndex }){
    if (![ 0, 1, 2, 3 ].includes(statusBarIndex)) return
    const indexToProperty = [
      'firstStatusBar',
      'secondStatusBar',
      'thirdStatusBar',
    ]
    const selectedStatusBar = this[ indexToProperty[ statusBarIndex ] ]
    if (!selectedStatusBar) return

    selectedStatusBar.text = newText
  }

  initStatusBars(){
    this.firstStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,
      PRIORITY + 1)
    this.secondStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,
      PRIORITY)
    this.thirdStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,
      PRIORITY - 1)

    this.firstStatusBar.show()
    this.firstStatusBar.text = 'NIKETA APP STARTED'
    this.secondStatusBar.show()
    this.secondStatusBar.text = ''
    this.thirdStatusBar.show()
    this.thirdStatusBar.text = ''
  }

  findLinesInFocus(){
    const [ visibleRange ] = this.getEditor().visibleRanges
    const startLine = path('_start.line', visibleRange)
    const endLine = path('_end.line', visibleRange)

    return {
      startLine,
      endLine,
    }
  }

  async requestCancelation(){
    sendMessage({ requestCancelation : true })
    await delay(SMALL_DELAY)
    this.resetOnError()
  }
  
  getCurrentFile(){
    const editor = this.getEditor()
    const { fileName: currentFilePath, lineCount: loc } = editor.document
    if (!currentFilePath) return {}

    return {currentFilePath, loc}
  }

  async requestLintFile(){
    const {currentFilePath} = this.getCurrentFile()
    if (!currentFilePath) return console.log('currentFilePath is empty')

    sendMessage()
    const messageToSend = { 
      requestLintFile : true, 
      fileName : currentFilePath,
      ...this.getCalculated(),
    }

    sendMessage(messageToSend)
      .then(messageFromServer => {
        this.messageReceived(messageFromServer)
      })
      .catch(() => {
        this.resetOnError()
      })
  }

  requestTestRun(){
    const {loc, currentFilePath} = this.getCurrentFile()
    if (!currentFilePath) return console.log('currentFilePath is empty')

    this.setLatestFile(currentFilePath)

    if (this.isLocked()) return console.log('LOCKED')

    this.lock(loc)

    const messageToSend = {
      fileName : currentFilePath,
      ...this.getCalculated(),
    }

    sendMessage(messageToSend)
      .then(messageFromServer => {
        this.messageReceived(messageFromServer)
      })
      .catch(() => {
        this.resetOnError()
      })
  }

  getEditor(){
    const [ editor ] = window.visibleTextEditors
    if (!editor) throw new Error('!editor')

    return editor
  }

  async resetOnError(){
    this.unlock()
    this.setterStatusBar({
      newText        : '',
      statusBarIndex : 0,
    })
    await delay(SMALL_DELAY)
    this.setterStatusBar({
      newText        : '',
      statusBarIndex : 1,
    })
    await delay(SMALL_DELAY)
    this.setterStatusBar({
      newText        : 'with error',
      statusBarIndex : 2,
    })
  }
}


exports.initExtension = (mode) => {
  const worker = new Worker(mode)

  if(mode === 'auto.jest'){
    workspace.onDidSaveTextDocument(e => {
      if (worker.isLocked()) return console.log('LOCKED')
      worker.lock(e.lineCount)
      worker.setLatestFile(e.fileName)
  
      const messageToSend = {
        fileName : e.fileName,
        ...worker.getCalculated(),
      }
  console.log(`messageToSend`, messageToSend)
      sendMessage(messageToSend)
        .then(messageFromServer => {
          worker.messageReceived(messageFromServer)
        })
        .catch(err => {
          console.log(`err`, err)
          worker.resetOnError()
        })
    })
  }

  return worker
}
