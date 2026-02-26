import { ProgressStatus } from '@common/types/progress'
import { WindowEmitter } from '../window-emitter'

/**
 * ProgressMap - Manages progress tracking for various resources
 * Provides centralized progress management with window notification support
 */
class ProgressMap extends WindowEmitter {
  private registry: Map<string, ProgressStatus> = new Map<string, ProgressStatus>()

  get(resourceKey: string): ProgressStatus | null {
    return this.registry.get(resourceKey) || null
  }

  /**
   * Start tracking progress for a resource
   */
  start(resourceKey: string, resourceValue: string): void {
    const progressStatus: ProgressStatus = {
      progress: 0,
      resourceValue,
      done: false,
    }

    this.registry.set(resourceKey, progressStatus)
    this.updateProgress(resourceKey, progressStatus)
  }

  /**
   * Update progress for a resource
   */
  update(resourceKey: string, progress: number): void {
    const existingStatus = this.registry.get(resourceKey)
    if (!existingStatus) {
      return // Progress not started for this resource
    }

    const updatedStatus: ProgressStatus = {
      ...existingStatus,
      progress,
      done: false,
    }

    this.registry.set(resourceKey, updatedStatus)
    this.updateProgress(resourceKey, updatedStatus)
  }

  /**
   * Mark progress as done for a resource
   */
  done(resourceKey: string): void {
    const existingStatus = this.registry.get(resourceKey)
    if (!existingStatus) {
      return // Progress not started for this resource
    }

    // Mark as complete (100%)
    const completedStatus: ProgressStatus = {
      ...existingStatus,
      progress: 100,
      done: true,
    }

    this.registry.delete(resourceKey)
    this.updateProgress(resourceKey, completedStatus)
  }

  /**
   * Notify all registered windows of a progress update
   */
  private updateProgress(resourceKey: string, status: ProgressStatus): void {
    this.emitToAllWindows('progress:update', resourceKey, status)
  }
}

// Create singleton instance
export const progressMap = new ProgressMap()
export default progressMap
