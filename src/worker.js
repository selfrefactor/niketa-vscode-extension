const { filter } = require('rambdax')
const { minimatch } = require('minimatch')
const { window, workspace } = require('vscode')
const { spawnCommand, readJson, runInVsCodeTerminal } = require('./utils')
const { getSpecFilePath } = require('./get-spec-file-path')

class Worker {
  constructor() {
    this.niketaScripts = []
    this.niketaScriptsLegacy = {}
    this.dir = workspace.workspaceFolders[0].uri.path
    this.initialized = true
  }

  async evaluateNiketaScriptsLegacy() {
    const currentFilePath = this.getCurrentFile()
    const relativeFilePath = currentFilePath.replace(`${this.dir}/`, '')
    if (!this.niketaScriptsLegacy[relativeFilePath]) return false

    const [command, ...inputs] =
      this.niketaScriptsLegacy[relativeFilePath].split(' ')
    if (!command) return false
    await spawnCommand({
      command,
      cwd: this.dir,
      inputs,
      onLog: () => {},
    })

    return true
  }

  getCurrentFile() {
    const editor = this.getEditor()
    const { fileName: currentFilePath } = editor.document

    return currentFilePath ?? ''
  }

  getEditor() {
    const editor = window.activeTextEditor
    if (!editor) throw new Error('!editor')

    return editor
  }

  init() {
    const packageJson = readJson(`${this.dir}/package.json`)
    if (packageJson.niketaScripts) {
      this.niketaScripts = packageJson.niketaScripts
      return
    }
    if (packageJson.niketaScriptsLegacy) {
      this.niketaScriptsLegacy = packageJson.niketaScriptsLegacy
    }
  }

  async requestTestRun() {
    const currentFilePath = this.getCurrentFile().replace(`${this.dir}/`, '')
    const scriptsToRun = this.niketaScripts
    if (!scriptsToRun) return
    const [foundScriptKey] = filter(
      (x) => minimatch(currentFilePath, x),
      Object.keys(scriptsToRun),
    )
    if (!foundScriptKey) return
    const actualFilePath = getSpecFilePath(currentFilePath, this.dir)
    let command = `${scriptsToRun[foundScriptKey]} ${actualFilePath}`
    let label = 'Test'

    await runInVsCodeTerminal({
      command,
      label,
      closeAfter: false,
    })
  }

  async biomeLint() {
    const currentFilePath = this.getCurrentFile()

    // lint with biome 
    const command = `run lint:file:unsafe'
    } ${currentFilePath}`
    //   isTestFile ? 'lint:file:unsafe' : 'lint:file'
    await runInVsCodeTerminal({
      command,
      label: 'Lint',
      closeAfter: true,
    })
  }

  async requestRun() {
    if (Object.keys(this.niketaScriptsLegacy).length > 0) {
      return this.evaluateNiketaScriptsLegacy()
    }
    // fallback if user presses run button, it will lint if no test script is found
    if (Object.keys(this.niketaScripts).length === 0)
      return this.biomeLint()

    await this.requestTestRun()
  }
}

exports.initExtension = () => {
  const worker = new Worker()

  return worker
}
