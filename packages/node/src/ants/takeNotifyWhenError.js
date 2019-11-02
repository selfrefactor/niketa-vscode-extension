export function takeNotifyWhenError({ stdout, stderr }){
  if (!stdout.includes('console.log')) return stderr.includes('FAIL') ? stderr : false
  const [ , ...toNotify ] = stdout.split('console.log')
  const maybeErrorMessage = stderr.includes('FAIL') ? 
    `==== ${stderr} ||` : ''
    
  return `${maybeErrorMessage} console.log ${ toNotify.join('console.log') }`
}
