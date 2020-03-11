import { resolve } from 'path'
import {execCommandAnt} from './ants/execCommand'

const PRETTY_HTML_PATH = `node_modules/@starptech/prettyhtml/cli/index.js`

export async function prettyHtmlMode(filePath){
  const command = `node ${PRETTY_HTML_PATH} ${filePath}`
  const cwd = resolve(__dirname, '../')
  const sk = await execCommandAnt(command, cwd)
  console.log({sk})
}