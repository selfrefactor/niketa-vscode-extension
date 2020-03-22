import prettyHtmlLib from '@starptech/prettyhtml'
import { readFileSync, writeFileSync } from 'fs'
import { log } from 'helpers'

export async function prettyHtml(filePath){
  const input = readFileSync(filePath, 'utf8')
  const { contents } = await prettyHtmlLib(input, {
    printWidth  : 55, 
    useTabs     : true,
    usePrettier : false,
    sortAttributes: true
  })
  writeFileSync(
    filePath, contents, 'utf8'
  )
  log(`${ filePath } linted with PrettyHTML`, 'info')
}
