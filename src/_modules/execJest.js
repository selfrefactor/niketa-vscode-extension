const { exec } = require('child_process')
const { NUM_FAILED } = require('../constants')

function execJest(
  command,
  options
) {
  return new Promise(
    (resolve, reject) => {
      exec(
        command,
        options,
        (error, stdout, stderr) => {
          if (error) {
            if (stdout.toString().includes(NUM_FAILED)){
              return resolve({
                stdout,
                stderr,
              })
            }
            reject({
              error,
              stdout,
              stderr,
            })
          }
          resolve({
            stdout,
            stderr,
          })
        })
    })
}

exports.execJest = execJest
