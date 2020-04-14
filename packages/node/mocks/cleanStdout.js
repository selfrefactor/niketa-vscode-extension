import { remove } from 'rambdax'

export function cleanStdout(input){
  if (!input.includes('------------|')){
    return input
  }

  const toReturn = remove(/--------------\|(.|\n)+--------------\|/, input)

  return toReturn
}
