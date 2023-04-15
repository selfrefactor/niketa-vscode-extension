import prettyHtmlLib from '@starptech/prettyhtml'
import {execPrettier} from 'lint-fn'
import {readFileSync, writeFileSync} from 'fs'
import {log} from 'helpers-fn'

const injectOptions = '--print-width 34'

export async function prettyHtml(filePath: string) {
  try {
    await execPrettier({
      filePath,
      prettierSpecialCase: 'html-local',
      injectOptions,
    })
    return true
    const input = readFileSync(filePath, 'utf8')
    const {contents} = await prettyHtmlLib(input, {
      printWidth: 55,
      useTabs: true,
      usePrettier: false,
      sortAttributes: true,
    })
    writeFileSync(filePath, contents, 'utf8')
    log(`${filePath} linted with PrettyHTML`, 'info')
  } catch (err) {
    console.log(err, 'prettyHtml')
    log(`${filePath} fail when linted with PrettyHTML`, 'error')
    return false
  }
}
