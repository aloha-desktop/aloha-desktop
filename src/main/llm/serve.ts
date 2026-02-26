import { SpecificVersion } from 'electron-ollama'
import { electronOllama } from './electron-ollama'
import { progressMap } from '../progress/progress-map'

export async function serve(version: SpecificVersion): Promise<void> {
  const isRunning = await electronOllama.isRunning()
  if (isRunning) {
    return
  }

  try {
    progressMap.start('llm-engine-serve', 'ollama')

    await electronOllama.serve(version, {
      serverLog: (message: string) => console.log('[Ollama]', message),
      downloadLog: (percent: number, message: string) => {
        progressMap.update('llm-engine-serve', percent)
        console.log('[Ollama Download]', message)
      },
      timeoutSec: 20, // 20 seconds
    })
  } finally {
    progressMap.done('llm-engine-serve')
  }
}
