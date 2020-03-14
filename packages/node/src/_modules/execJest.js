const { exec } = require('child_process')
const { ms } = require('string-fn')

function execJest(command, options){
  return new Promise(resolve => {
    const timeoutHolder = setTimeout(() => resolve({ takesTooLong : true }), ms('3 minutes'))

    exec(
      command, options, (
        _, stdout, stderr
      ) => {
        clearTimeout(timeoutHolder)
        resolve({
          stdout,
          stderr,
        })
      }
    )
  })
}

exports.execJest = execJest
