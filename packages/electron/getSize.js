const { exec } = require('helpers-fn')
const { existsSync } = require('fs')
const { match } = require('rambdax')
const { writeJsonSync, readJsonSync } = require('fs-extra')

const command = 'xdpyinfo  | grep \'dimensions:\''
const FILE_PATH = `${ __dirname }/config.json`
const FALLBACK = `${ __dirname }/files/configFallback.json`

function calculateSizes(width, height){
  return {
    width  : Math.floor(width * 0.25),
    height : Math.floor(height * 0.83),
    x      : Math.floor(width * 0.75),
    y      : Math.floor(height * 0.1),
  }
}

async function setSizes(){
  const [ sizesRaw ] = await exec({
    cwd : __dirname,
    command,
  })
  console.log({ size : sizesRaw })
  const [ sizes ] = match(/[0-9x]+/, sizesRaw)
  const [ screenWidth, screenHeight ] = sizes.split('x')
  const electronSizes = calculateSizes(screenWidth, screenHeight)

  writeJsonSync(FILE_PATH, electronSizes)
}

function getSize(recalculateFlag = false){
  if (!recalculateFlag){
    if (existsSync(FILE_PATH)) return readJsonSync(FILE_PATH)
    setSizes()

    return readJsonSync(FALLBACK)
  }

  return new Promise(resolve => {
    setSizes().then(resolve)
  })
}

exports.getSize = getSize
