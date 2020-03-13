const {ms} = require('string-fn') 
const { exec } = require('child_process')

function execJest(command, options){
  return new Promise(resolve => {
    const timeoutHolder = setTimeout(() => {
      return resolve({
        takesTooLong: true,
      })
    }, ms('3 minutes'));

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
