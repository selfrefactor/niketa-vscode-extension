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

  const isAngularDevDependecy =
    devDependencies === undefined ?
      false :
      '@angular/core' in devDependencies

  const isAngularDependecy =
    dependencies === undefined ? false : '@angular/core' in dependencies

  holder[ dir ] = {
    hasAngular : isAngularDependecy || isAngularDevDependecy,
    hasWallaby,
  }

  return holder[ dir ]
}

exports.getCornerCases = getCornerCases
