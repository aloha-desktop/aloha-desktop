import { IpcMainEvent } from 'electron'

export function out(_: IpcMainEvent, messages: string[]): void {
  console.log('terminal:out', ...messages)
}
