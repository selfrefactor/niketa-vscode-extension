const { benchmarkEval } = require('helpers')
const { multiline } = require('rambdax')
const { show, tooltip } = require('../bar')

async function performBenchmark(content){
  try {
    const { first, second, diff } = await benchmarkEval(content)

    show(multiline(`
      ${ first > second ? 'First' : 'Second' }
      wins
      ${ diff }
    `))
    tooltip(`${ first } ${ second }`)
  } catch (err){
    console.log(err)
    throw 'bench'
  }
}

exports.performBenchmark = performBenchmark
