import { existsSync } from 'fs'
import { lintFn } from 'lint-fn'

export async function lintAnt(filePath){
  if (!existsSync(filePath)) return

  await lintFn(filePath)
}
