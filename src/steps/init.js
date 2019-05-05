const fastify = require('fastify')()
const io = require('socket.io')(fastify.server)
const vscode = require('vscode')
const {saved} = require('./saved')
const {
  emitToBar,
  show,
  startSpinner,
  stopSpinner,
  tooltip,
} = require('../bar')
const { niketaConfig } = require('../_modules/niketaConfig')

const { emit } = require('../_modules/emitter')
const { getCwd } = require('../_modules/getCwd')
const { hasReact } = require('../_modules/hasReact')
const { ok, getter, replace } = require('rambdax')

function showRoute(request){
  ok(request)({ message : 'string' })
  show(request.message)
}

function startSpinnerRoute(){
  startSpinner()
}

function stopSpinnerRoute(){
  stopSpinner()
}

function tooltipRoute(request){
  ok(request)({ message : 'string' })
  tooltip(request.message)
}

function additionalRoute(request){
  ok(request)({ message : 'string' })
  emitToBar({
    name      : 'thirdBar',
    text      : request.message,
    afterText : request.message,
  })
}

io.on('connection', socket => {
  console.log('connected', niketaConfig('PORT_0'))

  socket.on('show', showRoute)
  socket.on('startSpinner', startSpinnerRoute)
  socket.on('stopSpinner', stopSpinnerRoute)
  socket.on('tooltip', tooltipRoute)
  socket.on('additional', additionalRoute)
})

function emitAnt({filePath, mode }){
  const dir = getCwd(filePath)
  if (dir === false) return

  emit({
    channel  : 'fileSaved',
    dir,
    filePath,
    hasReact : hasReact(dir),
    mode,
  })
}

function rabbitHole(filePath){
  emitAnt({
    filePath,
    mode     : getter('MODE'),
  })
}

function shouldNiketa(text){

  return text.includes('sk_') && text.trim().length > 5
}

function whenNiketa({character, line,text}){
  const startPosition = new vscode.Position(
    line,
    character
  )
  const endPosition = new vscode.Position(
    line,
    text.length - character
  )
  const range = new vscode.Range(
    startPosition,
    endPosition
  )

  vscode.window.activeTextEditor.edit(editBuilder => {
    const replaced = replace(
      /sk_.+/, 
      '',
      text,
    )

    editBuilder.replace(range, replaced) 
  })
}


function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(e => {
    const {character, line} = vscode.window.activeTextEditor.selection.active

    const {text} = e.lineAt(line)
    const isNiketa = shouldNiketa(text)

    if(isNiketa) whenNiketa({character, text, line})

    saved({
      text,
      filePath: e.fileName,
      emitAnt,
      rabbitHole,
      isNiketa
    })
  })
}

fastify.listen(
  niketaConfig('PORT_0')
)

exports.init = () => {
  initWatcher()

}