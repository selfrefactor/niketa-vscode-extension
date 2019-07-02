const vscode = require('vscode')

function niketaConfig(key){
  return vscode
    .workspace
    .getConfiguration('niketa')
    .get(key)
}

exports.niketaConfig = niketaConfig