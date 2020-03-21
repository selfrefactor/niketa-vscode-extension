import { log } from 'helpers'
import { resolve } from 'path'
import { execCommandAnt } from './ants/execCommand'

const PRETTY_HTML_PATH = 'node_modules/@starptech/prettyhtml/cli/index.js'

export async function prettyHtmlMode(filePath){
  const command = `node ${ PRETTY_HTML_PATH } ${ filePath }`
  const cwd = resolve(__dirname, '../')
  await execCommandAnt(command, cwd)
  log(`${ filePath } linted with PrettyHTML`, 'info')
}
