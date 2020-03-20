const { existsSync } = require('fs')
const { last, replace } = require('rambdax')

function getSpecFile(filePath){
  const filtered = [ '.js', '.ts' ].filter(x =>
    filePath.includes(x))
  if (filtered.length === 0) return false

  const extension = last(filtered)
  if (filePath.includes('.spec.')) return filePath

  const maybeSpecFile = replace(
    extension, `.spec${ extension }`, filePath
  )

  const ok = existsSync(maybeSpecFile)
  if (!ok) return false

  return maybeSpecFile
}

exports.getSpecFile = getSpecFile
