import { remove } from 'rambdax'

const rules = [ /Test Suites:(.|\n)+/, /FAIL(.|\n)+TypeError:/ ]

export function cleanFail(text){
  const result = remove(rules, text.toString())

  return result
}
