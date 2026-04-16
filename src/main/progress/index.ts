import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { progressStatus } from './status'

export function useProgress(): void {
  ipcMain.handle('progress:status', (_: IpcMainInvokeEvent, resourceKey: string) => progressStatus(resourceKey))
}
