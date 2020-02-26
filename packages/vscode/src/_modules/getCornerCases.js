const { existsSync, readFileSync } = require('fs')
const holder = {}

function getCornerCases(dir){
  if (holder[ dir ] !== undefined){
    return holder[ dir ]
  }

  const location = `${ dir }/package.json`
  const hasWallaby = existsSync(`${ dir }/wallaby.js`)
  if (!existsSync(location)){
    holder[ dir ] = false

    return holder[ dir ]
  }

  const packageJsonString = readFileSync(location).toString()
  const { dependencies, devDependencies } = JSON.parse(packageJsonString)

  const isDevDependecy =
    devDependencies === undefined ? false : 'react' in devDependencies

  const isAngularDevDependecy =
    devDependencies === undefined ?
      false :
      '@angular/core' in devDependencies

  const isDependecy =
    dependencies === undefined ? false : 'react' in dependencies

  const isAngularDependecy =
    dependencies === undefined ? false : '@angular/core' in dependencies

  holder[ dir ] = {
    react: isDependecy || isDevDependecy,
    angular: isAngularDependecy || isAngularDevDependecy,
    wallaby: hasWallaby
  }

  return holder[ dir ]
}

exports.getCornerCases = getCornerCases
