const vscode = require('vscode')

const notify = message => {
  vscode.window.showInformationMessage(message)
}

exports.notify = notify
