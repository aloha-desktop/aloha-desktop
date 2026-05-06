import { app, shell, BrowserWindow, Tray, nativeImage } from 'electron'
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
import os from 'os'

const TRAY_ICON_FILE_NAME: Record<'win32' | 'darwin' | 'linux', string> = {
  win32: 'win.ico',
  darwin: 'iconTemplate.png',
  linux: 'icon-512px.png',
}

let tray: Tray | null = null
let mainWindowInstance: BrowserWindow | null = null
let isQuitting = false

function focusOrCreateWindow(): void {
  if (mainWindowInstance && !mainWindowInstance.isDestroyed()) {
    if (mainWindowInstance.isMinimized()) mainWindowInstance.restore()
    mainWindowInstance.show()
    mainWindowInstance.focus()
  } else {
    mainWindowInstance = createWindow()
  }
}

// Enforce single instance — must be called before app.whenReady()
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  // Another instance is already running; quit this one immediately.
  app.quit()
} else {
  // A second instance tried to launch — focus the existing window instead.
  app.on('second-instance', focusOrCreateWindow)
}

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

  mainWindow.on('show', () => {
    mainWindow.setSkipTaskbar(false)
    if (app.dock) app.dock.show()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      mainWindow.setSkipTaskbar(true)
      if (app.dock) app.dock.hide()
    }
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

  // When the user triggers a real quit (e.g. Cmd+Q), allow windows to close.
  app.on('before-quit', () => {
    isQuitting = true
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  useTerminal()
  useStorage()
  useLLM()
  mainWindowInstance = createWindow()
  usePlugins()
  useProgress()
  useUpdater()
  useSetup()
  useGateway()

  // Setup Tray
  const trayIconFileName = TRAY_ICON_FILE_NAME[os.platform()]
  const trayIcon = nativeImage.createFromPath(
    app.isPackaged
      ? path.resolve(process.resourcesPath, './tray/', trayIconFileName)
      : path.resolve(__dirname, '../../resources/tray/', trayIconFileName)
  )
  tray = new Tray(trayIcon)
  tray.setToolTip('Aloha Desktop')
  tray.on('click', focusOrCreateWindow)

  // handle file:// links
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    if (!filePath.startsWith('file://')) {
      throw new Error('The file path should start with file://')
    }

    const purePath = path.normalize(decodeURI(filePath).substring(7))
    shell.showItemInFolder(purePath)
  })

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', focusOrCreateWindow)
})

// Keep app running in the background for all platforms when all windows are closed.
// The app can only be quit explicitly from the tray menu.
app.on('window-all-closed', () => {
  // Do nothing. Let the app continue running in the background.
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
