# Progress Tracking System

This progress tracking system allows Electron windows to listen to progress updates from the main process and maintain synchronized state for downloads and other long-running operations.

## Main Process Usage

```typescript
import { startProgress, updateProgress, doneProgress } from '@main/progress/map'

export async function downloadModel(modelName: string): Promise<void> {
  const resourceKey = `model-${modelName}`

  try {
    startProgress(resourceKey, `Downloading ${modelName} model`)

    // Simulate download progress
    for (let i = 1; i <= 100; i++) {
      updateProgress(resourceKey, i)
      await downloadChunk() // Your actual download logic
    }
  } finally {
    doneProgress(resourceKey)
  }
}
```

## Renderer Process Usage

```typescript
data() {
  return {
    modelDownloadProgress: null as ProgressStatus | null,
    removeProgressListener: () => {},
  }
},
async mounted() {
  this.modelDownloadProgress = await this.$electron.ipcRenderer.invoke('progress:status', 'model-download')
  this.removeProgressListener = this.$electron.ipcRenderer.on('progress:update', this.onProgressUpdate)
  // load data etc
},
beforeUnmount() {
  this.removeProgressListener()
},
methods: {
  onProgressUpdate(_: IpcRendererEvent, resourceKey: string, progressStatus: ProgressStatus) {
      if (resourceKey === 'model-download') {
        this.modelDownloadProgress = !progressStatus.done ? progressStatus : null
      }
  }
}
```

## Events

The system uses the following IPC events:

- `progress:status` - Get current progress status for a resource
- `progress:update` - Receive progress updates from main process

## Features

- 🚀 **Real-time Updates**: Progress updates are sent immediately to all registered windows
- 💾 **State Persistence**: Progress state persists across window reloads
- 🧹 **Automatic Cleanup**: Progress entries are automatically removed when completed
- 🛡️ **Type Safety**: Full TypeScript support with proper typing

