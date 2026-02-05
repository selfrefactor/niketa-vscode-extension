let { existsSync } = require('fs');

/**
 * It makes sure that:
 *
 * 1. If filepath includes `.spec.` it returns the same filepath
 * 2. If it doesn't, then it adds `.spec.` before the extension and checks if the file exists. If the file doesn't exist, it returns `false`
 */
function getSpecFilePath(
  filePath,
  directory
) {
  if (filePath.includes('.spec.')) return filePath;

  const splitted = filePath.split('.');
  const extension = splitted.pop();
  const newFilePath = `${splitted.join('.')}.spec.${extension}`;
  if(
    !existsSync(`${directory}/${newFilePath}`)
  ) return filePath;
  return newFilePath;
}

exports.getSpecFilePath = getSpecFilePath;