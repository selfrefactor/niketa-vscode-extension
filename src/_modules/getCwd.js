const {
  append,
  dropLast,
  head,
  ifElse,
  join,
  piped,
  range,
  remove,
  split,
} = require('rambdax')
const { existsSync } = require('fs')

const getPath = (filePath, i) => piped(
  filePath,
  split('/'),
  dropLast(i),
  join('/'),
  append('/package.json'),
  ifElse(
    maybePath => existsSync(maybePath),
    remove('/package.json'),
    () => false
  )
)

let holder

function getCwd(filePath){
  if (holder !== undefined) return holder

  const paths = range(0, filePath.split('/').length - 1)
    .map(i => getPath(filePath, i))

  const ok = paths.filter(Boolean).length > 0

  holder = ok ?
    head(paths.filter(Boolean)) :
    false

  return holder
}

exports.getCwd = getCwd
