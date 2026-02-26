import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { initialize } from './initialize'
import { createChat } from './chat-crud'

export function useStorage(): void {
  ipcMain.handle('storage:initialize', initialize)
  ipcMain.handle('storage:create-chat', (_: IpcMainInvokeEvent, name: string) => createChat(name))
}
