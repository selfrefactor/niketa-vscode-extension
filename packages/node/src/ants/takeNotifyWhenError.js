import { cleanStdout } from '../_modules/cleanStdout.js'

export function takeNotifyWhenError({ stdout, stderr }){
  if (!stdout.includes('console.log'))
    return stderr.includes('FAIL') ? stderr : false

  const cleaner = cleanStdout(stdout)
  const [ , ...toNotify ] = cleaner.split('console.log')

  const maybeErrorMessage = stderr.includes('FAIL') ?
    `====\n ${ stderr }` :
    ''

  return `console.log ${ toNotify.join('console.log') } ${ maybeErrorMessage }`
}
