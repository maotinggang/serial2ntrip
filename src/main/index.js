'use strict'
import path from 'path'
import { app, BrowserWindow, Menu, Tray } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\')
}

let mainWindow
const winURL =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`
let tray
function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: 650,
    backgroundColor: '#2e2c29',
    minWidth: 650,
    minHeight: 200
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  // 关闭按钮最小化到托盘
  mainWindow.on('close', e => {
    if (mainWindow.isMinimized()) {
      mainWindow = null
    } else {
      e.preventDefault()
      mainWindow.minimize()
      mainWindow.hide()
    }
  })
  tray = new Tray(path.join(__static, 'icon.ico')) // static 文件夹资源打包可用
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'quit',
      click: () => {
        app.quit()
        app.quit()
      }
    }
  ])
  tray.setToolTip('Serial-NTRIP')
  tray.on('click', function() {
    mainWindow.show()
  })
  tray.setContextMenu(contextMenu)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.commandLine.appendSwitch('disable-background-timer-throttling') // 避免最小化停止运行

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
