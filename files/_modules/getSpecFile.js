const { existsSync } = require('fs')
const { last, replace } = require('rambdax')

function getSpecFile(holder){
  const { filePath } = holder
  const filtered = [ '.js', '.ts', '.jsx', '.tsx' ].filter(
    x => filePath.includes(x)
  )
  if (filtered.length === 0) return

  const extension = last(filtered)
  const maybeSpecFile = replace(
    extension,
    `.spec${ extension }`,
    filePath
  )
  const ok = existsSync(maybeSpecFile)
  if (!ok) return

  return maybeSpecFile
}

exports.getSpecFile = getSpecFile
