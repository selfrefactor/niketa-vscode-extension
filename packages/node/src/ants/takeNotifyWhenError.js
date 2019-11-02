function removeCoverageBoilerplate(input){
  if(!input.includes('------------|')) return input

  const [toReturn] = input.split('------------|')

  return toReturn
}

export function takeNotifyWhenError({ stdout, stderr }){
  if (!stdout.includes('console.log')) return stderr.includes('FAIL') ? stderr : false
  const cleaner = removeCoverageBoilerplate(stdout)
  const [ , ...toNotify ] = cleaner.split('console.log')
  const maybeErrorMessage = stderr.includes('FAIL') ? 
    `====\n ${stderr}` : ''

  return `console.log ${ toNotify.join('console.log') } ${maybeErrorMessage}`
}
