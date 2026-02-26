import { app } from 'electron'
import ElectronOllama from 'electron-ollama'

export const electronOllama = new ElectronOllama({
  basePath: app.getPath('userData'),
})
