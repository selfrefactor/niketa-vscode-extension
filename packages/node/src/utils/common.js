import { log } from 'helpers-fn'
import { pass, remove, repeat, type } from 'rambdax'

export const JEST_BIN = './node_modules/jest/bin/jest.js'
export const ERROR_ICON = '❌'
export const SUCCESS_ICON = '🐬'
export const SHORT_SEPARATOR = repeat('🍄', 2).join('')
export const LONG_SEPARATOR = repeat('🍺', 20).join('')

export function isWorkFile(x){
  return x.startsWith(`${ process.env.HOME }/work/`)
}

export function cleanAngularLog(x){
  return {
    ...x,
    stderr : remove(/ts-jest\[.+/, x.stderr),
  }
}

export function toNumber(x){
  return x === undefined || Number.isNaN(Number(x)) ? 0 : Number(x)
}

export function parse(x){
  const result = Math.round(x * 100) / 100

  return parseFloat(`${ result }`)
}

export const maybeWarn = x => x < 0 ? `❗${ x }` : x

export function extractNumber(text){
  const justText = text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '')

  const asNumber = Number(justText.trim())

  if (type(asNumber) === 'NaN'){
    return justText.trim()
  }

  return asNumber
}

export const defaultEmit = x => console.log(x, 'emit not yet initialized')

const messageSchema = {
  hasTypescript : Boolean,
  fileName      : String,
}

export function isMessageCorrect(message){
  const isCorrect = pass(message)(messageSchema)
  if (!isCorrect){
    log('isMessageCorrect', 'error')
    log(message, 'obj')

    return false
  }

  return true
}

export function isLintable(fileName){
  return fileName.endsWith('.js') || fileName.endsWith('.ts')
}
