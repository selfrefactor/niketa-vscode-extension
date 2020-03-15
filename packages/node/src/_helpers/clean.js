import { remove } from 'rambdax'

export const clean = x => remove([
  'console.log',
  'console.error',
  'console.warn',
  /[a-zA-Z./_-]+:[0-9]{1,3}/,
], x).trim()
