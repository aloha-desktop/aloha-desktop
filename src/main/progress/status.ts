import { ProgressStatus } from '@common/types/progress'
import { progressMap } from './progress-map'

export function progressStatus(resourceKey: string): ProgressStatus | null {
  return progressMap.get(resourceKey)
}
