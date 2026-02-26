import { AIModel } from '@common/types/ai-model'
import models from '../../../resources/models.json' // statically excluded from main bundle unless VITE_FETCH_MODELS_STATIC is true

let modelsCache: AIModel[] | null = null

export async function fetchModels(): Promise<AIModel[]> {
  if (!modelsCache) {
    if (import.meta.env.MAIN_VITE_FETCH_MODELS_STATIC === 'true') {
      modelsCache = models
    } else {
      const response = await fetch(
        'https://raw.githubusercontent.com/aloha-desktop/aloha-desktop/refs/heads/main/models.json'
      )
      modelsCache = await response.json()
    }
  }

  return modelsCache as AIModel[]
}
