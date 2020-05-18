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
const { REQUEST_CANCELATION, DISABLE_ENABLE } = require('./constants')
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
          console.log('Connected')
          client.write(JSON.stringify(messageToSend))
        }
      )

      client.on('data', data => {
        console.log('Received: ' + data)
        client.destroy()

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
    this.enabled = true
    this.hasWallaby = undefined
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
    this.loc = loc
    this.startLoading()
  }

  unlock(){
    if (!this.lockFlag) return
    this.lockFlag = false
  }

  init(){
    this.hasWallaby = existsSync(`${ this.dir }/wallaby.js`)
    this.hasTypescript = existsSync(`${ this.dir }/tsconfig.json`)
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
      hasWallaby    : this.hasWallaby,
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
    const messages = firstBarMessage === '' ?
      [' ', ' ', ' '] :
      [firstBarMessage, secondBarMessage, thirdBarMessage]  

    await delay(SMALL_DELAY)
    this.setterStatusBar({
      newText        : messages[0],
      statusBarIndex : 0,
    })

    await delay(SMALL_DELAY)
    if (messages[1]){
      this.setterStatusBar({
        newText        : messages[1],
        statusBarIndex : 1,
      })
    }
    await delay(SMALL_DELAY)
    if (messages[2]){
      this.setterStatusBar({
        newText        : messages[2],
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
    if (![ 0, 1, 2 ].includes(statusBarIndex)) return
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

    this.firstStatusBar.command = REQUEST_CANCELATION
    this.firstStatusBar.show()
    this.firstStatusBar.text = 'NIKETA'
    this.secondStatusBar.show()
    this.secondStatusBar.text = 'APP'
    this.thirdStatusBar.command =DISABLE_ENABLE
    this.thirdStatusBar.show()
    this.thirdStatusBar.text = 'INIT'

    delay(3200).then(() => {
      this.secondStatusBar.text = ''
      this.thirdStatusBar.text = ''
    })
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

  disableEnable(){
    this.enabled = !this.enabled
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

const worker = new Worker()

function initExtension(){
  workspace.onDidOpenTextDocument(e => {
    console.log(e)
  })
  workspace.onDidSaveTextDocument(e => {
    // if(!this.enabled)return
    if (worker.isLocked()) return console.log('LOCKED')
    worker.lock(e.lineCount)

    const messageToSend = {
      fileName : e.fileName,
      ...worker.getCalculated(),
    }

    sendMessage(messageToSend)
      .then(messageFromServer => {
        worker.messageReceived(messageFromServer)
      })
      .catch(() => {
        worker.resetOnError()
      })
  })
}

exports.initExtension = () => {
  initExtension()

  return worker
}
