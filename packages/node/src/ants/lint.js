// import { lintFn } from '../../../lint-fn/index'
import { lintFn } from 'lint-fn'
import { remove } from 'rambdax'

export async function lintAnt(filePath){
  const logResult = await lintFn({
    filePath,
    logFlag : true,
    prettierFlag : true,
    fixFlag : true,
  })

  return remove(/\/home\/s\//g, logResult)
}
