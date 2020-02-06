const { exec } = require('child_process')

function execJest(command, options){
  return new Promise(resolve => {
    exec(
      command, options, (
        _, stdout, stderr
      ) => {
        resolve({
          stdout,
          stderr,
        })
      }
    )
  })
}

exports.execJest = execJest
