import { createPinia } from 'pinia'
import { AgentElectronAPI } from './electron'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    $electron: AgentElectronAPI
  }
}

export const pinia = createPinia()

pinia.use(() => ({ $electron: window.electron }))
