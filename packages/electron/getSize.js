const {match} = require('rambdax')
const {exec} = require('helpers')
const {writeJsonSync, readJsonSync} = require('fs-extra')
const {existsSync} = require('fs')

const command = "xdpyinfo  | grep 'dimensions:'"
const FILE_PATH = `${__dirname}/config.json`
const FALLBACK = `${__dirname}/files/configFallback.json`

function calculateSizes(width, height){
  return {
    width  : Math.floor(width * 0.45),
    height : Math.floor(height * 0.41),
    x      : Math.floor(width * 0.54),
    y      : Math.floor(height * 0.58),
  }
}

async function setSizes(){
  const [sizesRaw] = await exec({
    cwd: __dirname,
    command
  })
  const [sizes] = match(/[0-9x]+/,sizesRaw)
  const [screenWidth,screenHeight] = sizes.split('x')
  const electronSizes = calculateSizes(screenWidth, screenHeight)

  writeJsonSync(FILE_PATH, electronSizes)
}

function getSize(){
  if(
    existsSync(FILE_PATH)
  ) return readJsonSync(FILE_PATH)
  setSizes()  

  return readJsonSync(FALLBACK)
}

exports.getSize = getSize