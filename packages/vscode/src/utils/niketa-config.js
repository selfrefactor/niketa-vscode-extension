const { workspace } = require('vscode')

function niketaConfig(key){
  return workspace.getConfiguration('niketa').get(key)
}

exports.niketaConfig = niketaConfig
