const { readFileSync } = require('node:fs')
const { spawn } = require('node:child_process')
const { window } = require('vscode')

const terminalsRegistry = {}

function runInVsCodeTerminal({ command, label, closeAfter }) {
  if (
    !terminalsRegistry[label] ||
    terminalsRegistry[label].exitStatus !== undefined
  ) {
    terminalsRegistry[label] = window.createTerminal({ name: label })
  }
  terminalsRegistry[label].sendText(command)
  terminalsRegistry[label].show(true)
  if (closeAfter) {
    setTimeout(() => {
      terminalsRegistry[label].dispose()
      delete terminalsRegistry[label]
    }, 2500)
  }
}

const spawnCommand = ({ command, cwd, inputs, onLog }) =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, inputs, {
      cwd,
      env: process.env,
      shell: true,
    })

    proc.stdout.on('data', chunk => {
      if (onLog) {
        onLog(chunk.toString())
      } else {
        console.log(chunk.toString())
      }
    })
    proc.stdout.on('end', () => resolve())
    proc.stdout.on('error', err => reject(err))
  })

function readJson(filePath) {
  const raw = readFileSync(filePath)
  const content = raw.toString()

  return JSON.parse(content)
}

exports.readJson = readJson
exports.spawnCommand = spawnCommand
exports.runInVsCodeTerminal = runInVsCodeTerminal
