export function takeNotifyWhenError({stdout}){
  if(!stdout.includes('console.log')) return false
  const [,...toNotify] = stdout.split('console.log')

  return `console.log ${toNotify.join('console.log')}`
}