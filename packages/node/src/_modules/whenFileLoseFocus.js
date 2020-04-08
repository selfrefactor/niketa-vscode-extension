import { existsSync } from 'fs'
import { lintFn } from 'lint-fn'

export async function whenFileLoseFocus(filePath, disableLint){
  if (disableLint) return
  if (!existsSync(filePath)) return

  await lintFn(filePath)
}
