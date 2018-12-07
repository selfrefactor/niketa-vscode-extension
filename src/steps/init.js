const fastify = require('fastify')()
const io = require('socket.io')(fastify.server)
const vscode = require('vscode')
const { emit } = require('../_modules/emitter')
const { hasReact } = require('../_modules/hasReact')
const { getCWD } = require('../_modules/getCWD')
const { ok, getter } = require('rambdax')
const { show, tooltip, startSpinner, stopSpinner } = require('../bar')

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
  ok(request)({message: 'string'})
  tooltip(request.message)
}

function startSpinnerRoute(){
  startSpinner()
}

function stopSpinnerRoute(){
  stopSpinner()
}

io.on('connection', socket => {
  console.log('connected', 3011);
  
  socket.on('show',showRoute)
  socket.on('startSpinner', startSpinnerRoute)
  socket.on('stopSpinner', stopSpinnerRoute)
  socket.on('tooltip', tooltipRoute)
})

function rabbitHole(e){
  const dir = getCWD(e.fileName)
  if(dir === false) return
  
  emit({
    channel  : 'fileSaved',
    dir,
    filePath : e.fileName,
    hasReact: hasReact(dir),
    mode     : getter('MODE'),
  })
}

const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
  borderWidth: '1px',
  borderStyle: 'solid',
  overviewRulerColor: 'blue',
  overviewRulerLane: vscode.OverviewRulerLane.Right,
  light: {
    borderColor: 'lightpink'
  },
  dark: {
    borderColor: 'darkpink'
  }
})

function mai(target){

	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		triggerUpdateDecorations();
	}

	function triggerUpdateDecorations() {
		updateDecorations()
	}

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /import|const/;
		const text = activeEditor.document.getText();
		const smallNumbers = [];
		const match = regEx.exec(text)
		const startPos = activeEditor.document.positionAt(match.index);
    const endPos = activeEditor.document.positionAt(match.index + match[0].length)

		const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number ****' };
		smallNumbers.push(decoration);
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
	}
}

function initWatcher(){
  vscode.workspace.onDidSaveTextDocument(e => {
    mai('test')
    if(getter('MODE') !== 'OFF') rabbitHole(e)
  })
}

fastify.listen(
  3011
)

exports.init = () => {
  initWatcher()
}
