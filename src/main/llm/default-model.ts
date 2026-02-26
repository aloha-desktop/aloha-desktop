import { getConfigValue, setConfigValue } from '../storage/config-crud'

export function setDefaultModel(model: string): void {
  setConfigValue('llm', 'default-model', model)
}

export function getDefaultModel(): string {
  return getConfigValue('llm', 'default-model')
}
