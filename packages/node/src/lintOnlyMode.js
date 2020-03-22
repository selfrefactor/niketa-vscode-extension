import { log } from 'helpers'
import { execPrettier } from 'lint-fn'

import { prettyHtml } from './_modules/prettyHtml'

async function usePrettier(filePath){
  const printWidth = filePath.endsWith('.html') ? 40 : 35
  const injectOptions = `--print-width ${ printWidth }`
  await execPrettier({
    filePath,
    injectOptions,
  })
  log(`${ filePath } linted with Prettier`, 'info')
}

export async function lintOnlyMode(filePath){
  const lintMethod = filePath.endsWith('.html') ? prettyHtml : usePrettier

  return lintMethod(filePath)
}
