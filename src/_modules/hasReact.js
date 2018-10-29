const {existsSync, readFileSync} = require('fs')
const holder = {}

function hasReact(dir){
  if(holder[dir] !== undefined){
    console.log('FROM CACHE', dir);
    
    return holder[dir]
  }

  const location = `${dir}/package.json`
  
  if(!existsSync(location)){
      holder[dir] = false
      return holder[dir]
  }

  const packageJsonString = readFileSync(location).toString()
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

  holder[dir] = isDependecy || isDevDependecy
  
  return holder[dir]
}

exports.hasReact = hasReact