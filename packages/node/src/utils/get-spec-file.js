const { existsSync } = require('fs')
const { replace } = require('rambdax')

function getSpecFile(filePath, extension){
  if (!filePath.endsWith(extension)) return {hasValidSpec: false}

  if (filePath.includes(`.spec${ extension }`)) return {hasValidSpec: false, specFile: filePath}

  const maybeSpecFile = replace(
    extension, `.spec${ extension }`, filePath
  )

  if (!existsSync(maybeSpecFile)) {hasValidSpec: false}

  return {hasValidSpec: false, specFile: maybeSpecFile}
}

exports.getSpecFile = getSpecFile
