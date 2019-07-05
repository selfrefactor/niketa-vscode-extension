const config = require('./config.json')
const fastify = require('fastify')()
const path = require('path')
const url = require('url')
const { anyTrue } = require('rambdax')
const { app, ipcMain, BrowserWindow } = require('electron')

const baseConfig = {
  autoHideMenuBar : true,
  webPreferences  : { nodeIntegration : true },
  frame           : true,
  show            : false,
  skipTaskbar     : true,
  type            : 'notification',
}

const settings = {
  ...baseConfig,
  ...config,
}

let mainWindow

const TIMEOUT = 12 * 1000

const io = require('socket.io')(fastify.server)
fastify.listen(3014)

let timeoutHolder

ipcMain.on('holdon', () => {
  if (timeoutHolder) clearTimeout(timeoutHolder)
})

io.on('connection', socket => {
  console.log('connected', 3014)

  socket.on('rabbit', () => {
    if (!mainWindow.isVisible()){
      mainWindow.showInactive()
      mainWindow.setAlwaysOnTop(true)
    }

    if (timeoutHolder) clearTimeout(timeoutHolder)

    timeoutHolder = setTimeout(() => {
      if (mainWindow.isVisible()){
        mainWindow.hide()
      }
    }, TIMEOUT)
  })
})

const dev = anyTrue(
  process.defaultApp,
  (/[\\/]electron-prebuilt[\\/]/).test(process.execPath),
  (/[\\/]electron[\\/]/).test(process.execPath)
)

function createWindow(){
  mainWindow = new BrowserWindow(settings)

  let indexPath

  if (dev && process.argv.indexOf('--noDevServer') === -1){
    indexPath = url.format({
      protocol : 'http:',
      host     : 'localhost:8080',
      pathname : 'index.html',
      slashes  : true,
    })
  } else {
    indexPath = url.format({
      protocol : 'file:',
      pathname : path.join(__dirname, 'dist', 'index.html'),
      slashes  : true,
    })
  }

  mainWindow.loadURL(indexPath)

  mainWindow.once('ready-to-show', () => {
    mainWindow.setAlwaysOnTop(true)
    mainWindow.setFullScreenable(false)

    // Usage with DEV
    ///////////////////////////
    if (false){
      mainWindow.showInactive()
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('closed', () => mainWindow = null)
}

app.on('ready', createWindow)
app.on('browser-window-created', (e, window) => {
  window.setMenu(null)
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
