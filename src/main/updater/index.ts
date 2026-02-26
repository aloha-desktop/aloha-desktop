import { BrowserWindow, ipcMain } from 'electron'
import { getCurrentStatus } from './status'
import { checkForUpdates } from './check-for-updates'
import { updaterManager } from './updater-manager'

export function useUpdater(): void {
  ipcMain.handle('updater:status', () => getCurrentStatus())
  ipcMain.handle('updater:check-for-updates', () => checkForUpdates())

  updaterManager.initialize()
}

export function useUpdaterWindow(browserWindow: BrowserWindow): void {
  // Register this window to receive updater status updates
  updaterManager.registerWindow(browserWindow)
}
