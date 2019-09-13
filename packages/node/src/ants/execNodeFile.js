import { spawn } from 'child_process'

export const execNodeFile = ({file, cwd}) =>
  new Promise((resolve, reject) => {
    const child = spawn('node', [file], {cwd});
      const logs = []

      child.stdout.on('data', chunk => {
        const sk = chunk.toString()
        logs.push(sk)
      });

      child.stderr.on('data', (err) => {
        reject(err.toString())
      });
      child.stderr.on('end', () => {
        resolve(logs)
      });
  })
