import { electronOllama } from './electron-ollama'

export function isEngineBuiltin(): boolean {
  return !!electronOllama.getServer()
}
