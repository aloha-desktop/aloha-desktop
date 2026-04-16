import { BrowserWindow } from 'electron'
import log from 'electron-log'
import { Gateway } from '../gateway/gateway'

export class WindowEmitter {
  private windows: BrowserWindow[] = []
  private gateway: Gateway | null = null

  constructor() {
    this.windows = []
    this.gateway = null
  }

  registerWindow(window: BrowserWindow): void {
    if (!this.windows.includes(window)) {
      this.windows.push(window)

      // Clean up when window is closed
      window.on('closed', () => {
        this.windows = this.windows.filter((w) => w !== window)
      })
    }
  }

  registerGateway(gateway: Gateway): void {
    this.gateway = gateway
  }

  emitToAllListeners(channel: string, ...args: unknown[]): void {
    for (const window of this.windows) {
      if (!window.isDestroyed()) {
        try {
          window.webContents.send(channel, ...args)
        } catch (error) {
          log.error(`Failed to emit ${channel} to window:`, error)
        }
      }
    }

    if (this.gateway) {
      try {
        this.gateway.sendMessage(channel, ...args)
      } catch (error) {
        log.error(`Failed to emit ${channel} to gateway:`, error)
      }
    }
  }
}

export const windowEmitter = new WindowEmitter()
