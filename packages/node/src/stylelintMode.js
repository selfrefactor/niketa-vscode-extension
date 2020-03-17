import { log } from 'helpers'
import { resolve } from 'path'

import { execCommandAnt } from './ants/execCommand'

const STYLELINT_PATH = 'node_modules/stylelint/bin/stylelint.js'

export async function stylelintMode(filePath){
  const command = `node ${ STYLELINT_PATH } --fix ${ filePath }`
  const cwd = resolve(__dirname, '../')
  await execCommandAnt(command, cwd)
  log(`${ filePath } linted with Stylelint`, 'info')
}
