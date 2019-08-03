const Nightmare = require('nightmare')
const { writeSync } = require('clipboardy')

const getBounds = async() => {
  const nm = new Nightmare({ webPreferences : { nodeIntegration : true } })
  const bounds = nm
    .goto('about:blank')
    .evaluate(() => {
      const electron = require('electron')
      const displays = electron.screen.getAllDisplays()
      const display = displays.find(d => d.bounds.x !== 0 || d.bounds.y !== 0) || displays[ 0 ]

      return display.bounds
    })
    .end()

  return bounds
}

function getSizes(width, height){
  return {
    width  : Math.floor(width * 0.45),
    height : Math.floor(height * 0.41),
    x      : Math.floor(width * 0.54),
    y      : Math.floor(height * 0.58),
  }
}

async function prepare(){
  const { width, height } = await getBounds()
  console.log({
    width,
    height,
  })
  const config = getSizes(width, height)

  const toClipboard = JSON.stringify(config, null, 2)
  writeSync(toClipboard)
  console.log(toClipboard)
}

prepare().then(console.log)
