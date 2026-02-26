import ollama, { ListResponse } from 'ollama'

export async function listModels(): Promise<ListResponse> {
  return ollama.list()
}
