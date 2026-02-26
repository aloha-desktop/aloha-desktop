import updaterManager from './updater-manager'

export async function checkForUpdates(): Promise<void> {
  return updaterManager.checkForUpdates()
}
