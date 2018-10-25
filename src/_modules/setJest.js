const { getSpecFile } = require('./getSpecFile')

function setJest(holder){
  const { filePath } = holder
  const fallback = {
    okInitJest : false,
    busy       : false,
  }

  const isTestFile = filePath.includes('.spec.')
  const specFile = isTestFile ?
    filePath :
    getSpecFile(holder)

  if (!specFile) return fallback

  return {
    okInitJest : true,
    specFile,
    busy       : true,
  }
}

exports.setJest = setJest
