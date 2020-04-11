const {workspace, window, Range, Position} = require('vscode')
const { delay, mapAsync, range, path } = require('rambdax')


const TOP_MARGIN = 3
const color = '#7cc36e'
const ms = 100
let timeoutHolder;
const decorations = {}
const decorationType = window.createTextEditorDecorationType({after: {margin: '0 0 0 1rem'}});

function work(editor, fileName){
  return () => {
    try {
      const newDecorations = Object.keys(decorations[fileName]).map(
        x => {
          return decorations[fileName][x]
        }
      )
      editor.setDecorations(
        decorationType,
        newDecorations
      )
    } catch (error) {
      console.log(error)
    }
  }
}

function refreshDecorations(fileName) {
  clearTimeout(timeoutHolder);
  const [editor] = window.visibleTextEditors
  if(!editor ) return
  
  timeoutHolder = setTimeout(
    work(editor, fileName),    
    ms
  );
}

const adjustFileName = '/home/s/repos/rambda/source/adjust.js'
const specFileName = '/home/s/repos/rambda/source/adjust.spec.js'

const testData = [
  {
    fileName: adjustFileName,
    logData: {
      1: 'foo',
      5: 'foo1',
      6: 'foo1',
      8: 'foo2',
      9: 'foo3',
    }
  },
  {
    fileName: specFileName,
    logData: {
      3: 'bat',
      4: 'foo1',
      5: 'foo2',
    }
  },
]

let logData = []

function loadLogData(newLogData){
  logData = newLogData.slice()
}

function logIsEmpty(){
  return logData.length === 0
}


function decorateWithLogData(fileName){
  try {
    if(logIsEmpty()) return

    const currentLog = logData.find(x => x.fileName === fileName)
    if(currentLog === undefined){
      return console.log('no log data for file', fileName)
    }
    decorations[fileName] = {}

    const iteratable = (testDataKey => {
      const line = Number(testDataKey)
      const toShow = currentLog.logData[testDataKey]
      const decoration = {
        renderOptions: {after: {contentText: toShow, color}},
        range: new Range(new Position(line - 1, 1024), new Position(line - 1, 1024))
      };

      decorations[fileName][testDataKey] = decoration
    })

    Object.keys(currentLog.logData).map(iteratable)

    refreshDecorations(fileName);
  } catch (error) {
    console.log(error)    
  }
}

function findLinesInFocus(){
  try {
    const [editor] = window.visibleTextEditors
    if(!editor ) return
    const [visibleRange] = editor.visibleRanges
    const startLine = path('_start.line', visibleRange)
    const endLine = path('_end.line', visibleRange)
    return {startLine, endLine}
  } catch (error) {
  console.log(error)    
  }
}

async function logUnreliableData(fileName){
  try {
    if(logIsEmpty()) return
    const {startLine,endLine} = await findLinesInFocus()
    const currentLog = logData.find(x => x.fileName === fileName)
    if(currentLog === undefined){
      return console.log('no log data for file', fileName)
    }
    decorations[fileName] = {}
    const linesToUse = endLine - startLine - TOP_MARGIN
    const len = currentLog.logUnreliableData.length

    const endPoint = len < linesToUse ? startLine + len : endLine

    const iteratable = ((lineNumber,i) => {
      const toShow = currentLog.logUnreliableData[i]
      const decoration = {
        renderOptions: {after: {contentText: toShow, color}},
        range: new Range(new Position(lineNumber - 1, 1024), new Position(lineNumber - 1, 1024))
      };

      decorations[fileName][lineNumber] = decoration
    })
    range(startLine+TOP_MARGIN, endPoint).map(iteratable)

    refreshDecorations(fileName);
  } catch (error) {
    console.log(error)    
  }
}

function initDecorate(){
  loadLogData(testData)
  findLinesInFocus()
  workspace.onDidSaveTextDocument(e => {
    console.log(1)
    // decorateWithLogData(e.fileName)
  })
}

exports.initDecorate = initDecorate