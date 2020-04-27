const { existsSync } = require('fs')
const { replace } = require('rambdax')

function getSpecFile(filePath, extension){
  if (!filePath.endsWith(extension)) return false

  if (filePath.includes(`.spec${ extension }`)) return filePath

  const maybeSpecFile = replace(
    extension, `.spec${ extension }`, filePath
  )

  if (!existsSync(maybeSpecFile)) return false

  return maybeSpecFile
}

exports.getSpecFile = getSpecFile
