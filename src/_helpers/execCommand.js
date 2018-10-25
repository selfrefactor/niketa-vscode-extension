const { exec } = require('child_process')

function execCommand(
  command,
  options
) {
  return new Promise(
    resolve => {
      exec(
        command,
        options,
        (err, stdout, stderr) => {
          if (err) console.log(err)

          resolve({
            stdout,
            stderr,
          })
        }
      )
    })
}

exports.execCommand = execCommand
