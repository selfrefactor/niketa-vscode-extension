import execa from 'execa'
const JEST_BIN = './node_modules/jest/bin/jest.js'

export async function execJest(fileName, cwd){
  const testPattern = `-- ${ fileName }`
  const commandInputs = [
    JEST_BIN,
    // '-u',
    // '--maxWorkers=1',
    '--env=node',
    testPattern,
  ]
  console.log('before')
  const command = `node ${ JEST_BIN } ${ commandInputs.join(' ') }`
  const subprocess = execa.command(command, { cwd })
  // const subprocess = execa('node', commandInputs, {cwd});
  console.log('after')

  setTimeout(() => {
    // subprocess.kill('SIGTERM', {
    //   forceKillAfterTimeout: 2000
    // })
    subprocess.cancel()
  }, 10)

  try {
    console.log('before await')
    const result = await subprocess
    console.log(123)

    return result
  } catch (error){
    console.log(12)
    console.log(subprocess.killed) // true
    console.log(error.isCanceled)

    return error
  }
}
