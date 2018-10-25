const {
  range,
  repeat,
  prop,
} = require('rambdax')
const { existsSync } = require('fs')
const { hasReact } = require('../_helpers/hasReact')
const { resolve, parse } = require('path')
const { show } = require('../bar')

function setWorkSpace(filePath){
  const fallback = {
    ok   : false,
    init : true,
  }
  const basePath = parse(filePath).dir

  //How deep to look for package.json
  const mapped = range(0, 8).map(
    i => {
      const levelsAbove = repeat('../', i).join('')
      const maybePathBase = i === 0 ?
        './package.json' :
        `${ levelsAbove }package.json`

      const maybePath = resolve(
        basePath,
        maybePathBase,
      )

      return {
        ok   : existsSync(maybePath),
        path : maybePath,
      }
    }
  )
  const ok = mapped.filter(prop('ok')).length > 0
  if (!ok) return fallback

  const x = mapped.filter(prop('ok'))[ 0 ]

  show('AUTO_JEST_READY')

  return {
    ok       : true,
    init     : true,
    dir      : parse(x.path).dir,
    hasReact : hasReact(x.path),
  }
}

exports.setWorkSpace = setWorkSpace
