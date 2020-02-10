import { remove } from 'rambdax'

export const clean = x => remove([
  'console.log',
  'console.error',
  'console.warn',
  /[a-zA-Z./]+:[0-9]{1,3}/,
], x).trim()
