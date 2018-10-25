const vscode = require('vscode')
const { execJestTest } = require('../_modules/execJestTest')
const { isBenchmark } = require('../_helpers/isBenchmark')
const { lintFn } = require('lint-fn')
const { merge } = require('rambdax')
const { performBenchmark } = require('../_modules/performBenchmark')
const { setJest } = require('../_modules/setJest')
const { setWorkSpace } = require('../_modules/setWorkSpace')
const { show, lintBar } = require('../bar')
const { verifyExtension } = require('../_helpers/verifyExtension')

function init(){
  let holder = {
    init : false,
    busy : false,
  }

  vscode.workspace.onDidSaveTextDocument(_ => {
    const okBenchmark = isBenchmark(_, holder)
    if (okBenchmark.ok){
      holder.busy = true
      performBenchmark(okBenchmark.content).then(() => {
        holder.busy = false
      })
        .catch(console.log)
    }

    if (holder.busy) return console.log('holder.busy')

    const initPassed = holder.filePath !== undefined
    const blurEvent = holder.filePath !== _.fileName
    const okLint = blurEvent && initPassed

    const okExtension = initPassed ?
      verifyExtension(holder.filePath) :
      false

    const lintFilePath = okLint && okExtension ?
      holder.filePath :
      false

    holder.filePath = _.fileName

    if (!holder.init){
      const setResult = setWorkSpace(_.fileName)
      holder = merge(holder, setResult)
    }

    if (!holder.ok) return show('🀱🀱')

    const initJestResult = setJest(holder)
    holder = merge(holder, initJestResult)

    if (holder.okInitJest){
      execJestTest(holder).then(() => {
        holder.busy = false
      })
        .catch(console.log)
    }

    /**
     * On filepath changed
     * we can lint the previous filepath.
     */
    if (lintFilePath){
      lintBar({ text : '⏳' })

      lintFn({
        filePath : lintFilePath,
        logFlag  : false,
        fixFlag  : true,
      }).then(logData => {
        lintBar({
          text    : logData === '' ? '🇩🇪 ' : '🇧🇬',
          tooltip : logData === '' ? 'OK' : logData,
        })
      })
        .reject(console.log)
    }

  })
}

exports.init = init
