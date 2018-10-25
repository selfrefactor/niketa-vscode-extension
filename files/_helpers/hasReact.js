const { readFileSync } = require('fs')

function hasReact(packageJsonPath){
  const packageJsonString = readFileSync(packageJsonPath).toString()
  const {
    dependencies,
    devDependencies,
  } = JSON.parse(packageJsonString)

  const isDevDependecy = devDependencies === undefined ?
    false :
    'react' in devDependencies

  const isDependecy = dependencies === undefined ?
    false :
    'react' in dependencies

  return isDependecy || isDevDependecy
}

exports.hasReact = hasReact
