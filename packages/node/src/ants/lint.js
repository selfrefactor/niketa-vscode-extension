import { existsSync } from 'fs'
import { lintFn } from 'lint-fn'

export async function lintAnt(filePath){
  if(!existsSync(filePath)) return

  const logResult = await lintFn({
    filePath,
    logFlag      : true,
    prettierFlag : true,
    fixFlag      : true,
  })

  return logResult
}
