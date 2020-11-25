import {log} from 'helpers-fn'
import {pass, remove, repeat, type} from 'rambdax'
import { ExecResult } from 'src/interfaces'

export const JEST_BIN = './node_modules/jest/bin/jest.js'
export const ERROR_ICON = '❌'
export const SUCCESS_ICON = '🐬'
export const SHORT_SEPARATOR = repeat('🍄', 2).join('')
export const LONG_SEPARATOR = repeat('🍺', 20).join('')

export function cleanAngularLog(x: ExecResult) {
  return {
    ...x,
    stderr: remove(/ts-jest\[.+/, x.stderr),
  }
}

export function toNumber(x: any) {
  return x === undefined || Number.isNaN(Number(x)) ? 0 : Number(x)
}

export function parse(x: number) {
  const result = Math.round(x * 100) / 100

  return parseFloat(`${result}`)
}

export const maybeWarn = (x: number) => (x < 0 ? `❗${x}` : x)

export function extractNumber(text: string) {
  const justText = text.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  )

  const asNumber = Number(justText.trim())

  if (type(asNumber) === 'NaN') {
    return justText.trim()
  }

  return asNumber
}

export const defaultEmit = (x: any) => console.log(x, 'emit not yet initialized')

const messageSchema = {
  hasTypescript: Boolean,
  fileName: String,
}

export function isMessageCorrect(message: Record<string, any>) {
  const isCorrect = pass(message)(messageSchema)
  if (!isCorrect) {
    log('isMessageCorrect', 'error')
    log(message, 'obj')

    return false
  }

  return true
}

export function isLintable(fileName: string) {
  return fileName.endsWith('.js') || fileName.endsWith('.ts')
}
