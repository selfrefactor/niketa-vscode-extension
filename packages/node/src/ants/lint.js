import { lintFn } from 'lint-fn'

export async function lintAnt(filePath){
  const logResult = await lintFn({
    filePath,
    logFlag      : true,
    prettierFlag : true,
    fixFlag      : true,
  })

  return logResult
}
