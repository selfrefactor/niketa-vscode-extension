import { remove } from 'rambdax'

const rules = [
  /console.error.{1,40}\n.{2,400}\n.{1,120}/g,
  /--------------------(.|\n)+/,
]

export function cleanStdout(text){
  const result = remove(rules, text.toString())

  return result
}
