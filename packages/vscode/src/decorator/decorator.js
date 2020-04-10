const {workspace, window, Range, Position} = require('vscode')
const { delay, tryCatch } = require('rambdax')

const color = '#7cc36e'
const ms = 10
let decorationsDebounce;
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
  clearTimeout(decorationsDebounce);
  const [editor] = window.visibleTextEditors
  if(!editor ) return
  
  decorationsDebounce = setTimeout(
    work(editor, fileName),    
    ms
  );
}

function decorate({text, fileName, line}) {
  try {
    // const range = tryCatch(() => {
    //   return new Range(new Position(4, 10), new Position(4, 12))
    // }, false)()
    // if(range === false) return
    if(
      decorations[fileName]=== undefined
    ){
      decorations[fileName]= {}
    }
    
    const sk = {
      renderOptions: {after: {contentText: text, color}},
      range: new Range(new Position(line - 1, 1024), new Position(line - 1, 1024))
    };
    decorations[fileName][line] = sk
    refreshDecorations(fileName);
  } catch (error) {
    console.log(error)    
  }
}

function initDecorate(){
  workspace.onDidSaveTextDocument(e => {
    console.log(99,e.fileName)
    decorate({text: 'fopo',fileName:e.fileName, line: 5})
  })
}

exports.decorate = decorate
exports.initDecorate = initDecorate