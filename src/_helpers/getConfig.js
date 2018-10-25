const vscode = require('vscode')

function getConfig(key){
  return vscode
    .workspace
    .getConfiguration('niketa')
    .get(key)
}

exports.getConfig = getConfig