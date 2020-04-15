import { existsSync } from 'fs'
import { lintFn } from 'lint-fn'
import { log } from 'helpers-fn'

export async function whenFileLoseFocus(filePath){
  if (!existsSync(filePath)) return
  log('sep')
  log(`willLint ${filePath}`, 'info')
  log('sep')
  
  await lintFn(filePath)
}