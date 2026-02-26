import { electronOllama } from './electron-ollama'

export async function listDownloaded(): Promise<string[]> {
  return await electronOllama.downloadedVersions()
}
