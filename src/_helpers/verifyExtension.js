function verifyExtension(filePath){
  return [ '.js', '.jsx' ].filter(
    x => filePath.endsWith(x)
  ).length === 1
}

exports.verifyExtension = verifyExtension
