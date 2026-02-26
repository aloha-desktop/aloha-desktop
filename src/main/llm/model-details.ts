import ollama, { ShowResponse, ListResponse } from 'ollama'
import { ModelDetails } from '@common/types/model-capability'
import log from 'electron-log'

/**
 * Get capabilities for a specific model
 * @param modelName - The name of the model to get capabilities for
 * @returns Promise<ModelDetails> - The model capabilities
 */
export async function getModelDetails(modelName: string): Promise<ModelDetails> {
  try {
    const showResponse: ShowResponse = await ollama.show({ model: modelName })

    return {
      name: modelName,
      capabilities: showResponse.capabilities || [],
      parameterSize: showResponse.details?.parameter_size,
    }
  } catch (error) {
    log.error(`Error retrieving capabilities for model ${modelName}:`, error)
    throw error
  }
}

/**
 * Get capabilities for all available models
 * @returns Promise<ModelDetails[]> - Array of model capabilities
 */
export async function getAllModelDetails(): Promise<ModelDetails[]> {
  try {
    const listResponse: ListResponse = await ollama.list()
    const details: ModelDetails[] = []

    for (const model of listResponse.models) {
      try {
        const modelDetails = await getModelDetails(model.name)
        details.push(modelDetails)
      } catch (error) {
        log.warn(`Failed to get capabilities for ${model.name}:`, error)
        // Add basic capability info from list response
        details.push({
          name: model.name,
          capabilities: [],
          parameterSize: model.details?.parameter_size,
        })
      }
    }

    return details
  } catch (error) {
    log.error('Error retrieving model capabilities:', error)
    throw error
  }
}

/**
 * Check if a model has a specific capability
 * @param modelName - The name of the model
 * @param capability - The capability to check for (e.g., 'vision', 'tools', 'embed')
 * @returns Promise<boolean> - Whether the model has the capability
 */
export async function hasCapability(modelName: string, capability: string): Promise<boolean> {
  try {
    const details = await getModelDetails(modelName)
    return details.capabilities.includes(capability)
  } catch (error) {
    log.error(`Error checking capability for model ${modelName}:`, error)
    return false
  }
}

/**
 * Get models filtered by capability
 * @param capability - The capability to filter by (e.g., 'vision', 'tools', 'embed')
 * @returns Promise<ModelDetails[]> - Array of models with the specified capability
 */
export async function getModelsByCapability(capability: string): Promise<ModelDetails[]> {
  try {
    const allDetails = await getAllModelDetails()

    return allDetails.filter((model) => {
      return model.capabilities.includes(capability)
    })
  } catch (error) {
    log.error(`Error filtering models by capability ${capability}:`, error)
    return []
  }
}
