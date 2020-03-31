import { spawn } from 'child_process'
import { log } from 'helpers-fn'
import { delay } from 'rambdax'
import { ms } from 'string-fn'

export const execNodeFile = ({ file, cwd }) =>
  new Promise((resolve, reject) => {
    let resolved = false
    const child = spawn(
      'node', [ file ], { cwd }
    )
    const logs = []

    delay(ms('2min')).then(() => {
      if (resolved) return
      log(`will kill prove process ${ file }`, 'error')
      child.kill()
    })
    child.stdout.on('data', chunk => {
      const sk = chunk.toString()
      logs.push(sk)
    })

    child.stderr.on('data', err => {
      reject(err.toString())
    })
    child.stderr.on('end', () => {
      resolved = true
      resolve(logs)
    })
  })
