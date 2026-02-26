import { ipcMain } from 'electron'
import { out } from './out'
import { ping } from './ping'

export function useTerminal(): void {
  ipcMain.on('terminal:out', out)
  ipcMain.on('terminal:ping', ping)
}
