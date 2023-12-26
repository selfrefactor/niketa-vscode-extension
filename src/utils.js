const { readFileSync } = require('fs')
const { spawn } = require('child_process')
const { window } = require('vscode')

const terminalsRegistry = {}

function runInVsCodeTerminal({ command, label }) {
  if (!terminalsRegistry[ label ]) {
    terminalsRegistry[ label ] = window.createTerminal({ name : label });
  }
  terminalsRegistry[ label ].sendText(command);
  terminalsRegistry[ label ].show(true)
}

const spawnCommand = ({ command, cwd, inputs, onLog }) =>
  new Promise((resolve, reject) => {
    const proc = spawn(
      command, inputs, {
        cwd,
        env   : process.env,
        shell : true,
      }
    )

    proc.stdout.on('data', chunk => {
      if (onLog) onLog(chunk.toString())
      else console.log(chunk.toString())
    })
    proc.stdout.on('end', () => resolve())
    proc.stdout.on('error', err => reject(err))
  })

function readJson(filePath){
  const raw = readFileSync(filePath)
  const content = raw.toString()

  return JSON.parse(content)
}

exports.readJson = readJson
exports.spawnCommand = spawnCommand
exports.runInVsCodeTerminal = runInVsCodeTerminal