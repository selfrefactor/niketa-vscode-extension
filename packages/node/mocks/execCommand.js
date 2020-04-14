import { exec } from 'child_process'

export function execCommand(command, cwd = process.cwd()){
  return new Promise((resolve, reject) => {
    const proc = exec(command, { cwd })

    proc.stdout.on('data', chunk => {
      console.log(chunk.toString())
    })
    proc.stdout.on('end', resolve)
    proc.stdout.on('error', err => {
      reject(err)
    })
  })
}
