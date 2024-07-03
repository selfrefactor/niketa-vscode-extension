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

  async requestTestRun({ isTestFile }) {
    const currentFilePath = this.getCurrentFile().replace(`${this.dir}/`, '')
    const scriptsToRun = isTestFile
      ? this.niketaScripts.testCommands
      : this.niketaScripts.fileCommands
    if (!scriptsToRun) return
    const [foundScriptKey] = filter(
      (x) => minimatch(currentFilePath, x),
      Object.keys(scriptsToRun),
    )
    if (!foundScriptKey) return
    const actualFilePath = isTestFile
      ? getSpecFilePath(currentFilePath, this.dir)
      : currentFilePath
    let command = `${scriptsToRun[foundScriptKey]} ${actualFilePath}`
    let label = isTestFile ? 'Test' : 'Run'

    await runInVsCodeTerminal({
      command,
      label,
      closeAfter: false,
    })
  }

  async fallbackLint(isTestFile) {
    const currentFilePath = this.getCurrentFile()
    const command = `run ${
      isTestFile ? 'lint:file:unsafe' : 'lint:file'
    } ${currentFilePath}`
    await runInVsCodeTerminal({
      command,
      label: 'Lint',
      closeAfter: true,
    })
  }

  async requestRun({ isTestFile }) {
    if (Object.keys(this.niketaScriptsLegacy).length > 0) {
      return this.evaluateNiketaScriptsLegacy()
    }
    if (Object.keys(this.niketaScripts).length !== 2)
      return this.fallbackLint(isTestFile)

    await this.requestTestRun({ isTestFile })
  }
}

exports.initExtension = () => {
  const worker = new Worker()

  return worker
}
