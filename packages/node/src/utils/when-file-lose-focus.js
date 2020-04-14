import { existsSync } from 'fs'
import { lintFn } from 'lint-fn'

export async function whenFileLoseFocus(filePath){
  if (!existsSync(filePath)) return

  await lintFn(filePath)
}