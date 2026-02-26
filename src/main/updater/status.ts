import { updaterManager } from './updater-manager'

export function getCurrentStatus(): string {
  return updaterManager.getCurrentStatus()
}
