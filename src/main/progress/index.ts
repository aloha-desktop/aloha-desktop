import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'
import { progressStatus } from './status'
import { progressMap } from './progress-map'

export function useProgress(): void {
  ipcMain.handle('progress:status', (_: IpcMainInvokeEvent, resourceKey: string) => progressStatus(resourceKey))
}

export function useProgressWindow(browserWindow: BrowserWindow): void {
  // Register this window to receive progress updates
  progressMap.registerWindow(browserWindow)
}
