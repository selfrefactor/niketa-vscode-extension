const {  filter } = require('rambdax')
const { minimatch } = require('minimatch')
const {  window, workspace } = require('vscode')
const { spawnCommand, readJson, runInVsCodeTerminal } = require('./utils')
const { getSpecFilePath } = require('./get-spec-file-path')

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

  async requestTestRun({isTestFile}){
    const currentFilePath = this.getCurrentFile().replace(`${ this.dir }/`, '')
    const scriptsToRun = isTestFile ? this.niketaScripts.testCommands : this.niketaScripts.fileCommands
      if (!scriptsToRun) return
    const [ foundScriptKey ] = filter(x => minimatch(currentFilePath, x),
      Object.keys(scriptsToRun))
    if (!foundScriptKey) return
    const actualFilePath = isTestFile ? getSpecFilePath(currentFilePath, this.dir) : currentFilePath
    if(!actualFilePath) return
    let command = `${ scriptsToRun[ foundScriptKey ] } ${ actualFilePath }`
    let label = `${ isTestFile ? 'Test' : 'File' } run`
    // let label = `Niketa ${ isTestFile ? 'test' : 'file' } run - "${ foundScriptKey }"`

    await runInVsCodeTerminal({
      command,
      label  ,
    })
  }

  async requestRun({ isTestFile }){
    if(
      Object.keys(this.niketaScriptsLegacy).length > 0
    ){
      return this.evaluateNiketaScriptsLegacy()
    }
    if(Object.keys(this.niketaScripts).length !== 2) return

    await this.requestTestRun({isTestFile})
  }
}

exports.initExtension = () => {
  const worker = new Worker()

  return worker
}
