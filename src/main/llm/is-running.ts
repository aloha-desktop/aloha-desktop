import { electronOllama } from './electron-ollama'

export async function isRunning(): Promise<boolean> {
  return await electronOllama.isRunning()
}
