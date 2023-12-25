const {  filter } = require('rambdax')
const { minimatch } = require('minimatch')
const {  window, workspace } = require('vscode')
const { spawnCommand, readJson, runInVsCodeTerminal } = require('./utils')

class Worker{
  constructor(){
    this.niketaScripts = []
    this.niketaScriptsLegacy = {}
    this.dir = workspace.workspaceFolders[ 0 ].uri.path
  }

  async evaluateNiketaScriptsLegacy(){
    const currentFilePath = this.getCurrentFile()
    const relativeFilePath = currentFilePath.replace(`${ this.dir }/`, '')
    if (!this.niketaScriptsLegacy[ relativeFilePath ]) return false

    const [ command, ...inputs ] =
      this.niketaScriptsLegacy[ relativeFilePath ].split(' ')
    if (!command) return false
    await spawnCommand({
      command,
      cwd   : this.dir,
      inputs,
      onLog : () => {},
    })

    return true
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
    const packageJson = readJson(`${ this.dir }/package.json`)
    if (packageJson.niketaScripts) {
      this.niketaScripts = packageJson.niketaScripts
      return
    }
    if (packageJson.niketaScriptsLegacy) {
      this.niketaScriptsLegacy = packageJson.niketaScriptsLegacy
    }
  }

  async requestTestRun(index){
    const currentFilePath = this.getCurrentFile().replace(`${ this.dir }/`, '')
    const scripts = this.niketaScripts[ index ]
    const [ foundScriptKey ] = filter(x => minimatch(currentFilePath, x),
      Object.keys(scripts))
    if (!foundScriptKey) return

    let command = `${ scripts[ foundScriptKey ] } ${ currentFilePath }`
    let label = `Niketa run ${ index === 0 ? 'first' : 'second' } - "${ foundScriptKey }"`

    await runInVsCodeTerminal({
      command,
      label  ,
    })
  }

  async requestRun({ index }){
    if(
      Object.keys(this.niketaScriptsLegacy).length > 0
    ){
      return this.evaluateNiketaScriptsLegacy()
    }
    if(this.niketaScripts.length === 0) return

    await this.requestTestRun(index)
  }
}

exports.initExtension = () => {
  const worker = new Worker()

  return worker
}
