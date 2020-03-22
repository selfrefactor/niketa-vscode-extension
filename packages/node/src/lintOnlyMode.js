import { log } from 'helpers'
import { resolve } from 'path'
import { glue } from 'rambdax'

import { prettyHtml } from './_modules/prettyHtml'
import { execCommandAnt } from './ants/execCommand'

async function usePrettier(filePath){
  const cwd = resolve(__dirname, '../')
  const printWidth = filePath.endsWith('.html') ? 40 : 35

  const command = glue(`
  prettier 
  --print-width ${ printWidth }
  --write
  ${ filePath }
  `)

  await execCommandAnt(command, cwd)
  log(`${ filePath } linted with Prettier`, 'info')
}

export async function lintOnlyMode(filePath){
  const lintMethod = filePath.endsWith('.html') ? prettyHtml : usePrettier

  return lintMethod(filePath)
}
