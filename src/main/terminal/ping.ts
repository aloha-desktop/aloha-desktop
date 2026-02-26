import { IpcMainEvent } from 'electron'

export function ping(_: IpcMainEvent, counter: number): void {
  console.log('terminal:ping', 'pong', counter)
}
