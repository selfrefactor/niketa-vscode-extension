import { log } from 'helpers-fn'
import { execPrettier } from 'lint-fn'
import { any, endsWith, flip, switcher } from 'rambdax'

import { prettyHtml } from './pretty-html'
import { sortPackageJson } from './sort-package-json/sort-package-json'

const lintMethods = {
  sortPackageJson,
  prettyHtml,
  usePrettier,
}
const lintOnlyList = [ '.html', '.scss', '.css', 'package.json' ]

export function isLintOnlyMode(filePath){
  return any(flip(endsWith)(filePath), lintOnlyList)
}

async function usePrettier(filePath){
  const printWidth = filePath.endsWith('.html') ? 40 : 35
  const injectOptions = `--print-width ${ printWidth }`
  await execPrettier({
    filePath,
    injectOptions,
  })
  log(`${ filePath } linted with Prettier`, 'info')
}

export async function lintOnlyMode(filePath, callback){
  console.log('lintOnlyMode', filePath)

  const lintMethodKey = switcher(filePath)
    .is(x => x.endsWith('package.json'), 'sortPackageJson')
    .is(x => x.endsWith('.html'), 'prettyHtml')
    .default('usePrettier')

  const lintMethod = lintMethods[ lintMethodKey ]
  const lintResult = await lintMethod(filePath)
  if (callback) callback(filePath)

  return lintResult
}
