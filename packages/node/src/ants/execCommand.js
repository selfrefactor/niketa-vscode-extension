import { exec } from 'child_process'

export function execCommandAnt(command, cwd = process.cwd()){
  return new Promise((resolve, reject) => {
    let holder = ''
    const proc = exec(command, { cwd })

    proc.stdout.on('data', chunk => {
      console.log(chunk.toString())
      holder = chunk.toString()
    })
    proc.stdout.on('end', () => resolve(holder))
    proc.stdout.on('error', err => {
      reject(err)
    })
  })
}
