import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { useTerminal } from './terminal'
import { useLLM } from './llm'
import { useStorage } from './storage'
import { usePlugins } from './plugins'
import { useProgress } from './progress'
import { useUpdater } from './updater'
import { useSetup } from './setup'
import { useGateway } from './gateway'
import { windowEmitter } from './window-emitter'
import { ipcMain } from 'electron'
import path from 'path'

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
    },
  })

  windowEmitter.registerWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  let nativeUrl = join(__dirname, '../renderer/index.html')

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    nativeUrl = process.env['ELECTRON_RENDERER_URL']
    mainWindow.loadURL(nativeUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(nativeUrl)
  }

  mainWindow.maximize()

  // handling target="_blank"
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // handling clicking on a link without target="_blank"
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(nativeUrl) && !url.startsWith(`file://${nativeUrl}`)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  useTerminal()
  useStorage()
  useLLM()
  createWindow()
  usePlugins()
  useProgress()
  useUpdater()
  useSetup()
  useGateway()

  // handle file:// links
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    if (!filePath.startsWith('file://')) {
      throw new Error('The file path should start with file://')
    }

    const purePath = path.normalize(decodeURI(filePath).substring(7))
    shell.showItemInFolder(purePath)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
