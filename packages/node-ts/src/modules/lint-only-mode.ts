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

export function isLintOnlyMode(filePath: string){
  return any<any>(flip(endsWith)(filePath), lintOnlyList)
}

async function usePrettier(filePath: string){
  const printWidth = filePath.endsWith('.html') ? 50 : 70
  const injectOptions = `--print-width ${ printWidth }`
  await execPrettier({
    filePath,
    injectOptions,
  })
  log(`${ filePath } linted with Prettier`, 'info')
}

export async function lintOnlyMode(filePath: string){
  console.log('lintOnlyMode', filePath)

  const lintMethodKey = switcher<string>(filePath)
    .is((x: string) => x.endsWith('package.json'), 'sortPackageJson')
    .is((x: string) => x.endsWith('.html'), 'prettyHtml')
    .default('usePrettier')

  const lintMethod = (lintMethods as any)[ lintMethodKey ]
  const lintResult = await lintMethod(filePath)

  return lintResult
}
