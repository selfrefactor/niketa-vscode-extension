const {
  Position,
  Range,
  StatusBarAlignment,
  window,
  workspace,
} = require('vscode')
const { delay, ok, path, range, tryCatch } = require('rambdax')
const { existsSync, readFileSync } = require('fs')
const { niketaConfig } = require('./utils/niketa-config.js')
const { Socket } = require('net')
const { spawn } = require('child_process')

const CLIENT_PORT = niketaConfig('PORT')
const SMALL_DELAY = 15
const PRIORITY = 200

const spawnCommand = ({ command, cwd, inputs, onLog }) =>
  new Promise((resolve, reject) => {
    const proc = spawn(
      command, inputs, {
        cwd,
        env   : process.env,
        shell : true,
      }
    )

    proc.stdout.on('data', chunk => {
      if (onLog)
        onLog(chunk.toString())
      else
        console.log(chunk.toString())

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
    this.niketaScripts = {}
    this.options = {
      color      : '#7cc36e',
      ms         : 100,
      TOP_MARGIN : 3,
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

  buildCorrectDecorations(logData, loc){
    const pendingDecorations = []
    const iteratable = lineKey => {
      const line = Number(lineKey)
      if (line + 1 >= loc) return
      const toShow = logData[ lineKey ]
      const decoration = {
        range : new Range(new Position(line - 1, 1024),
          new Position(line - 1, 1024)),
        renderOptions : {
          after : {
            color       : '#7cc36e',
            contentText : toShow,
          },
        },
      }
      pendingDecorations.push(decoration)
    }

    Object.keys(logData).map(iteratable)

    return pendingDecorations
  }

  buildUnreliableDecorations({ endLine, logData, startLine }){
    const TOP_MARGIN = 3
    const linesToUse = endLine - startLine - TOP_MARGIN
    const len = logData.length

    const endPoint =
      len < linesToUse ? startLine + len + TOP_MARGIN : endLine

    const iteratable = (lineNumber, i) => {
      const toShow = logData[ i ]
      const decoration = {
        range : new Range(new Position(lineNumber - 1, 1024),
          new Position(lineNumber - 1, 1024)),
        renderOptions : {
          after : {
            color       : '#7cc36e',
            contentText : toShow,
          },
        },
      }

      return decoration
    }
    const loop = range(startLine + TOP_MARGIN, endPoint)

    return loop.map(iteratable)
  }

  clearDecorations(){
    window.visibleTextEditors.forEach(textEditor =>
      textEditor.setDecorations(this.decorationType, []))
  }

  async evaluateNiketaScripts(filePath){
    const relativeFilePath = filePath.replace(`${ this.dir }/`, '')
    if (!this.niketaScripts[ relativeFilePath ])
      return false

    const [ command, ...inputs ] =
      this.niketaScripts[ relativeFilePath ].split(' ')
    if (!command) return false
    await spawnCommand({
      command,
      cwd   : this.dir,
      inputs,
      onLog : () => {},
    })

    return true
  }

  findLinesInFocus(){
    const [ visibleRange ] = this.getEditor().visibleRanges
    const startLine = path('_start.line', visibleRange)
    const endLine = path('_end.line', visibleRange)

    return {
      endLine,
      startLine,
    }
  }

  getCalculated(){
    return {
      dir           : this.dir,
      hasTypescript : this.hasTypescript,
    }
  }

  getCurrentFile(){
    const editor = this.getEditor()
    const { fileName: currentFilePath } = editor.document

    return currentFilePath ?? ''
  }

  getEditor(){
    const editor = window.activeTextEditor
    if (!editor) throw new Error('!editor')

    return editor
  }

  init(){
    this.hasTypescript = existsSync(`${ this.dir }/tsconfig.json`)
    const packageJson = readJson(`${ this.dir }/package.json`)
    if (!packageJson.niketa) return
    this.niketaScripts = packageJson.niketa
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

  messageReceived(messageFromServer){
    const parse = () => JSON.parse(messageFromServer.toString())
    const parsedMessage = tryCatch(parse, false)()
    if (!parsedMessage) return

    const {
      firstBarMessage,
      hasDecorations,
      newDecorations,
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

    if (newDecorations.correct === true)
      return this.onCorrectDecorations(newDecorations, this.loc)

    if (newDecorations.correct === false)
      return this.onUnreliableDecorations(newDecorations)

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

    const { endLine, startLine } = await this.findLinesInFocus()
    const pendingDecorations = this.buildUnreliableDecorations({
      endLine,
      logData,
      startLine,
    })
    await this.paintDecorations(pendingDecorations)

    await delay(200)
  }

  onWrongIncomingMessage(message){
    console.error(message, 'onWrongIncomingMessage')
  }

  async paintDecorations(pendingDecorations){
    await delay(100)
    const editor = this.getEditor()

    editor.setDecorations(this.decorationType, pendingDecorations)
  }

  async requestCommandFactory(command){
    const currentFilePath = this.getCurrentFile()
    if (!currentFilePath){
      this.simpleMessageToUser('currentFilePath is empty')

      return console.log('currentFilePath is empty')
    }
    if (command.evaluateNiketaScripts)
      if (await this.evaluateNiketaScripts(currentFilePath)) return

    const messageToSend = {
      fileName : currentFilePath,
      ...this.getCalculated(),
      ...command.messageOptions ?? {},
    }
    this.simpleMessageToUser(command.initialMessage)

    try {
      const messageFromServer = await sendMessage(messageToSend)
      this.messageReceived(messageFromServer)
    } catch (e){
      this.resetOnError()
    }
  }

  async requestLintFile(){
    return this.requestCommandFactory({
      initialMessage : 'LINT FILE EXPECTED',
      messageOptions : { requestLintFile : true },
    })
  }

  async requestTestRun(){
    return this.requestCommandFactory({
      evaluateNiketaScripts : true,
      initialMessage        : 'TEST RUN EXPECTED',
    })
  }

  async requestThirdCommand(){
    return this.requestCommandFactory({
      initialMessage : 'THIRD COMMAND EXPECTED',
      messageOptions : { requestThirdCommand : true },
    })
  }

  async resetOnError(){
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
    if (tooltip)
      selectedStatusBar.tooltip = tooltip

  }

  simpleMessageToUser(message){
    this.updateStatusBars({
      firstBarMessage  : message,
      secondBarMessage : '',
      thirdBarMessage  : '',
      tooltip          : '',
    })
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
    if (messages[ 1 ])
      this.setterStatusBar({
        newText        : messages[ 1 ],
        statusBarIndex : 1,
      })

    await delay(SMALL_DELAY)
    if (messages[ 2 ])
      this.setterStatusBar({
        newText        : messages[ 2 ],
        statusBarIndex : 2,
      })

  }
}

exports.initExtension = () => {
  const worker = new Worker()

  return worker
}
