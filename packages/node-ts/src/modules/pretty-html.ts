import prettyHtmlLib from '@starptech/prettyhtml'
import { readFileSync, writeFileSync } from 'fs'
import { log } from 'helpers-fn'

export async function prettyHtml(filePath){
  try {
    const input = readFileSync(filePath, 'utf8')
    const { contents } = await prettyHtmlLib(input, {
      printWidth     : 55,
      useTabs        : true,
      usePrettier    : false,
      sortAttributes : true,
    })
    writeFileSync(
      filePath, contents, 'utf8'
    )
    log(`${ filePath } linted with PrettyHTML`, 'info')
  } catch (err) {
    console.log(err, 'prettyHtml');
    log(`${ filePath } fail when linted with PrettyHTML`, 'error')
  }
}
 