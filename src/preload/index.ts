import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import process from 'process'
import log from 'electron-log'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('contextIsolated', process.contextIsolated)
  } catch (error) {
    log.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.contextIsolated = process.contextIsolated
}
