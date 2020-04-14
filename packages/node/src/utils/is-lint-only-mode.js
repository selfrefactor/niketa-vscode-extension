import { any, endsWith, flip } from 'rambdax'
const lintOnlyList = [ '.html', '.scss', '.css' ]

export function isLintOnlyMode(filePath){
  return any(flip(endsWith)(filePath), lintOnlyList)
}
