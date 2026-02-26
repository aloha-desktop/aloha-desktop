import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { skipWelcome, setSkipWelcome } from './skip-welcome'

export function useSetup(): void {
  ipcMain.handle('setup:skip-welcome', skipWelcome)
  ipcMain.handle('setup:set-skip-welcome', (_: IpcMainInvokeEvent, isSkipWelcome: boolean) =>
    setSkipWelcome(isSkipWelcome)
  )
}
