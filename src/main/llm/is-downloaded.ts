import type { SpecificVersion } from 'electron-ollama'
import { electronOllama } from './electron-ollama'

export async function isDownloaded(version: SpecificVersion): Promise<boolean> {
  return await electronOllama.isDownloaded(version)
}
