import electronUpdater from 'electron-updater'
import log from 'electron-log'
import { WindowEmitter } from '../window-emitter'

const { autoUpdater } = electronUpdater
autoUpdater.logger = log

/**
 * UpdaterManager - Manages application updates and window notifications
 * Provides centralized auto-updater management with window notification support
 */
class UpdaterManager extends WindowEmitter {
  private currentStatus: string = 'Up to date 👍'

  constructor() {
    super()
  }

  getCurrentStatus(): string {
    return this.currentStatus
  }

  /**
   * Update status and notify all registered windows
   */
  private updateStatus(status: string): void {
    log.info('updateStatus', status)
    this.currentStatus = status
    this.emitToAllWindows('updater:on-status-change', status)
  }

  /**
   * Initialize the auto-updater with event listeners
   */
  initialize(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus('Checking for update...')
    })

    autoUpdater.on('update-available', () => {
      this.updateStatus('Update available.')
    })

    autoUpdater.on('update-not-available', () => {
      this.updateStatus('Up to date 👍')
    })

    autoUpdater.on('error', (err) => {
      this.updateStatus('Error in auto-updater. ' + err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      this.updateStatus(`Downloading update ${progressObj.percent.toFixed(1)}%`)
    })

    autoUpdater.on('update-downloaded', () => {
      this.updateStatus('Update downloaded')
    })

    this.checkForUpdates()
  }

  /**
   * Check for application updates
   */
  async checkForUpdates(): Promise<void> {
    this.updateStatus('Checking for update...')

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (!autoUpdater.isUpdaterActive()) {
      this.updateStatus('Updater is not active 🚫')
      return
    }

    await autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.error('Error checking for updates:', err)
      this.updateStatus('Failed to check for updates')
    })
  }
}

// Create singleton instance
export const updaterManager = new UpdaterManager()
export default updaterManager
