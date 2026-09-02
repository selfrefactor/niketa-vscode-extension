const { filter } = require('rambdax')
const { minimatch } = require('minimatch')
const { window, workspace } = require('vscode')
const {
  spawnCommand,
  readJson,
  writeJson,
  runInVsCodeTerminal,
} = require('./utils')
const { getSpecFilePath } = require('./get-spec-file-path')

/**
 * This force to both use alt+2 as well as don't modify filepath
 */
const LINT_COMMANDS = ['yarn lint:files','yarn lint:file']

const escapeTerminalPath = (path) => {
  return path.replace(/([()[\]])/g, '\\$1') // Escapes (, ), [, and ]
}

class Worker {
  constructor() {
    this.niketaScripts = []
    this.niketaScriptsLegacy = {}
    // New format fields
    this.niketaScriptsConfig = null // full new-format config { scripts, active }
    this.niketaScriptsNames = [] // list of named script sets
    this.currentScriptName = '' // currently active script name
    this.hasMultipleScripts = false // true when new format with at least 1 script
    this.dir = workspace.workspaceFolders[0].uri.path
    this.initialized = false
  }

  async evaluateNiketaScriptsLegacy() {
    const currentFilePath = this.getCurrentFile()
    const relativeFilePath = currentFilePath.replace(`${this.dir}/`, '')
    if (!this.niketaScriptsLegacy[relativeFilePath]) {
      return false
    }

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

  async init() {
    const location = `${this.dir}/package.json`
    const configJson = await readJson(location)

    if (configJson.niketaScripts) {
      // New format: { scripts: { Name: { glob: cmd } }, active: "Name" }
      if (
        configJson.niketaScripts.scripts &&
        configJson.niketaScripts.active !== undefined
      ) {
        this.niketaScriptsConfig = configJson.niketaScripts
        this.niketaScriptsNames = Object.keys(configJson.niketaScripts.scripts)
        this.currentScriptName = configJson.niketaScripts.active
        this.hasMultipleScripts = this.niketaScriptsNames.length > 0
        // Resolve to the active script set (glob → command mapping)
        this.niketaScripts =
          configJson.niketaScripts.scripts[configJson.niketaScripts.active] ||
          {}
      } else {
        // Old format: direct { "**/*.ts": "yarn test:file" }
        this.niketaScripts = configJson.niketaScripts
        this.niketaScriptsConfig = null
        this.niketaScriptsNames = []
        this.currentScriptName = ''
        this.hasMultipleScripts = false
      }
      this.initialized = true
      return
    }
    if (configJson.niketaScriptsLegacy) {
      this.niketaScriptsLegacy = configJson.niketaScriptsLegacy
    }
    this.initialized = true
  }

  /**
   * Cycle to the next named script in the list, write to package.json, and reload config.
   */
  async cycleActiveScript() {
    if (!this.niketaScriptsConfig || this.niketaScriptsNames.length === 0)
      return

    const currentIndex = this.niketaScriptsNames.indexOf(this.currentScriptName)
    const nextIndex = (currentIndex + 1) % this.niketaScriptsNames.length
    const nextName = this.niketaScriptsNames[nextIndex]

    const location = `${this.dir}/package.json`
    const configJson = await readJson(location)

    if (!configJson.niketaScripts) return

    configJson.niketaScripts.active = nextName
    await writeJson(location, configJson)

    // Reload config so worker picks up the change
    await this.init()
  }

  /**
   * Re-read package.json and re-initialize config (used after external changes).
   */
  async reloadConfig() {
    await this.init()
  }

  async requestScriptRun() {
    const currentFilePath = this.getCurrentFile().replace(`${this.dir}/`, '')
    const scriptsToRun = this.niketaScripts
    if (!scriptsToRun) return
    const label = 'Script'
    if (
      Object.keys(scriptsToRun).length === 1 &&
      scriptsToRun['*'] !== undefined
    ) {
      const command = `${scriptsToRun['*']} ${this.getCurrentFile()}`

      await runInVsCodeTerminal({
        command,
        label,
        closeAfter: false,
      })

      return
    }
    const [foundScriptKey] = filter(
      (x) => minimatch(currentFilePath, x),
      Object.keys(scriptsToRun),
    )
    if (!foundScriptKey) return

    const actualFilePath =
      LINT_COMMANDS.includes(scriptsToRun[foundScriptKey])
        ? this.getCurrentFile()
        : getSpecFilePath(currentFilePath, this.dir)
    const command = `${scriptsToRun[foundScriptKey]} ${actualFilePath}`

    await runInVsCodeTerminal({
      command,
      label,
      closeAfter: false,
    })
  }

  async standaloneLint() {
    const currentFilePath = this.getCurrentFile()
    let escapedPath = escapeTerminalPath(currentFilePath)
    // lint with biome/oxlint
    const command = `run fmt ${escapedPath}`

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
    if (Object.keys(this.niketaScripts).length === 0) {
      return this.standaloneLint()
    }

    await this.requestScriptRun()
  }
}

exports.initExtension = () => {
  const worker = new Worker()
  return worker
}
