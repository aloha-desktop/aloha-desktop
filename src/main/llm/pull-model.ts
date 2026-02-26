import ollama from 'ollama'
import { progressMap } from '../progress/progress-map'

export async function pullModel(model: string): Promise<void> {
  try {
    progressMap.start('llm-pull-model', model)
    const stream = await ollama.pull({ model, stream: true })
    let percent = 0

    for await (const part of stream) {
      if (part.digest) {
        if (part.completed && part.total) {
          percent = Math.round((part.completed / part.total) * 100)
          progressMap.update('llm-pull-model', percent)
        }
      }
    }
  } finally {
    progressMap.done('llm-pull-model')
  }
}
