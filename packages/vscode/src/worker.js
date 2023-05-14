const {
  workspace,
  window,
  Range,
  Position,
  StatusBarAlignment,
} = require('vscode')
const { delay, range, path, tryCatch, ok } = require('rambdax')
const { existsSync, readFileSync } = require('fs')
const { niketaConfig } = require('./utils/niketa-config.js')
const { Socket } = require('net')
const { spawn } = require('child_process')

const CLIENT_PORT = niketaConfig('PORT')
const SMALL_DELAY = 15
const PRIORITY = 200

const spawnCommand = ({ command, inputs, cwd, onLog }) =>
  new Promise((resolve, reject) => {
    const proc = spawn(
      command, inputs, {
        cwd,
        shell : true,
        env   : process.env,
      }
    )

    proc.stdout.on('data', chunk => {
      if (onLog){
        onLog(chunk.toString())
      } else {
        console.log(chunk.toString())
      }
    })
    proc.stdout.on('end', () => resolve())
    proc.stdout.on('error', err => reject(err))
  })

function readJson(filePath){
  const raw = readFileSync(filePath)
  const content = raw.toString()

  return JSON.parse(content)
}

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

      client.on('close', () => resolve(false))
    } catch (error){
      return reject(error)
    }
  })
}

class Worker{
  constructor(){
    this.lockFlag = false
    this.niketaScripts = {}
    this.options = {
      TOP_MARGIN : 3,
      color      : '#7cc36e',
      ms         : 100,
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

  setLock(newState){
    this.lockFlag = newState
    if (newState){
      this.startLoading()
    }
  }

  init(){
    this.hasTypescript = existsSync(`${ this.dir }/tsconfig.json`)
    const packageJson = readJson(`${ this.dir }/package.json`)
    if (!packageJson.niketa) return
    this.niketaScripts = packageJson.niketa
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
    await delay(100)
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
  }

  async updateStatusBars({
    firstBarMessage,
    secondBarMessage,
    thirdBarMessage,
    tooltip,
  }){
    const messages =
      firstBarMessage === '' ?
        [ ' ', ' ', ' ' ] :
        [ firstBarMessage, secondBarMessage, thirdBarMessage ]

    await delay(SMALL_DELAY)
    this.setterStatusBar({
      newText        : messages[ 0 ],
      statusBarIndex : 0,
      tooltip,
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

  simpleMessageToUser(message, fileName){
    this.updateStatusBars({
      firstBarMessage  : message,
      secondBarMessage : '',
      thirdBarMessage  : '',
      tooltip          : '',
    })
  }

  messageReceived(messageFromServer){
    const parse = () => JSON.parse(messageFromServer.toString())
    const parsedMessage = tryCatch(parse, false)()
    if (!parsedMessage) return

    const {
      hasDecorations,
      newDecorations,
      firstBarMessage,
      secondBarMessage,
      thirdBarMessage,
      tooltip,
    } = parsedMessage

    this.updateStatusBars({
      firstBarMessage,
      secondBarMessage,
      thirdBarMessage,
      tooltip,
    })
    if (hasDecorations === false) return this.clearDecorations()

    if (newDecorations.correct === true){
      return this.onCorrectDecorations(newDecorations, this.loc)
    }

    if (newDecorations.correct === false){
      return this.onUnreliableDecorations(newDecorations)
    }
  }

  clearDecorations(){
    window.visibleTextEditors.forEach(textEditor =>
      textEditor.setDecorations(this.decorationType, []))
  }

  setterStatusBar({ newText, statusBarIndex, tooltip = '' }){
    if (![ 0, 1, 2, 3 ].includes(statusBarIndex)) return
    const indexToProperty = [
      'firstStatusBar',
      'secondStatusBar',
      'thirdStatusBar',
    ]
    const selectedStatusBar = this[ indexToProperty[ statusBarIndex ] ]
    if (!selectedStatusBar) return

    selectedStatusBar.text = newText
    if (tooltip){
      selectedStatusBar.tooltip = tooltip
    }
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
    const { fileName: currentFilePath } = editor.document

    return currentFilePath ?? ''
  }

  async requestLintFile(){
    const currentFilePath = this.getCurrentFile()
    if (!currentFilePath) return console.log('currentFilePath is empty')

    const messageToSend = {
      requestLintFile : true,
      fileName        : currentFilePath,
      ...this.getCalculated(),
    }

    this.simpleMessageToUser('LINT EXPECTED')

    window.showInformationMessage('Info Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As ModalInfo Notification As Modal',
      { modal : true })
    sendMessage(messageToSend)
      .then(messageFromServer => {
        this.messageReceived(messageFromServer)
      })
      .catch(() => {
        this.resetOnError()
      })
  }

  async evaluateNikataScripts(filePath){
    const relativeFilePath = filePath.replace(`${ this.dir }/`, '')
    if (this.niketaScripts[ filePath ]) return false
    const [ command, ...inputs ] =
      this.niketaScripts[ relativeFilePath ].split(' ')
    await spawnCommand({
      cwd   : this.dir,
      inputs,
      command,
      onLog : () => {},
    })

    return true
  }

  async requestTestRun(){
    const currentFilePath = this.getCurrentFile()
    if (!currentFilePath){
      this.simpleMessageToUser('currentFilePath is empty')

      return console.log('currentFilePath is empty')
    }
    if (await this.evaluateNikataScripts(currentFilePath)) return

    this.setLatestFile(currentFilePath)

    if (this.isLocked()){
      return this.simpleMessageToUser('LOCKED')
    }

    this.setLock(true)

    const messageToSend = {
      fileName : currentFilePath,
      ...this.getCalculated(),
    }
    this.simpleMessageToUser('TEST RUN EXPECTED')

    try {
      const messageFromServer = await sendMessage(messageToSend)
      this.messageReceived(messageFromServer)
    } catch (e){
      this.resetOnError()
    }
  }

  getEditor(){
    const editor = window.activeTextEditor
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

exports.initExtension = () => {
  const worker = new Worker()

  return worker
}
