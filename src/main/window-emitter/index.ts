import { BrowserWindow } from 'electron'
import log from 'electron-log'

export class WindowEmitter {
  private windows: BrowserWindow[] = []

  constructor() {
    this.windows = []
  }

  registerWindow(window: BrowserWindow): void {
    this.windows.push(window)

    // Clean up when window is closed
    window.on('closed', () => {
      this.windows = this.windows.filter((w) => w !== window)
    })
  }

  emitToAllWindows(channel: string, ...args: unknown[]): void {
    for (const window of this.windows) {
      if (!window.isDestroyed()) {
        try {
          window.webContents.send(channel, ...args)
        } catch (error) {
          log.error(`Failed to emit ${channel} to window:`, error)
        }
      }
    }
  }
}
