const { readFileSync } = require('fs')

function isBenchmark(_, holder){
  const content = readFileSync(_.fileName).toString()
  const MARKERS = [ 'function first()', 'function second()' ]

  const ok = MARKERS.filter(
    x => content.includes(x)
  ).length === MARKERS.length

  return {
    ok,
    content,
  }
}

exports.isBenchmark = isBenchmark
