const { exec } = require('child_process')

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
            if (stdout.toString().includes('numFailedTests')){
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
