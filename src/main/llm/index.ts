import { BrowserWindow, ipcMain } from 'electron'
import { useChatRunner } from './chat-runner'
import { listModels } from './list-models'
import { listChats } from './list-chats'
import { listMessages } from './list-messages'
import { IpcMainInvokeEvent } from 'electron/main'
import { createChat } from './create-chat'
import { createMessage } from './create-message'
import { isRunning } from './is-running'
import { serve } from './serve'
import { isDownloaded } from './is-downloaded'
import { SpecificVersion } from 'electron-ollama'
import { fetchModels } from './fetch-models'
import { getDefaultModel, setDefaultModel } from './default-model'
import { pullModel } from './pull-model'
import { isEngineBuiltin } from './is-engine-builtin'
import { engineVersion } from './engine-version'
import { getModelDetails, getAllModelDetails, hasCapability, getModelsByCapability } from './model-details'
import { useActiveChats } from './active-chats'
import { abortChat } from './abort-chat'
import { isChatActive } from './is-chat-active'
import { chatRun } from './chat-run'
import { listDownloaded } from './list-downloaded'

export function useLLM(): void {
  ipcMain.handle('llm:list-models', listModels)
  ipcMain.handle('llm:fetch-models', fetchModels)
  ipcMain.handle('llm:set-default-model', (_: IpcMainInvokeEvent, model: string) => setDefaultModel(model))
  ipcMain.handle('llm:get-default-model', getDefaultModel)
  ipcMain.handle('llm:pull-model', (_: IpcMainInvokeEvent, model: string) => pullModel(model))
  ipcMain.handle('llm:list-chats', listChats)
  ipcMain.handle('llm:list-messages', (_: IpcMainInvokeEvent, chatUuid: string) => listMessages(chatUuid))
  ipcMain.handle('llm:create-chat', (_: IpcMainInvokeEvent, prompt: string) => createChat(prompt))
  ipcMain.handle('llm:create-message', (_: IpcMainInvokeEvent, content: string, chatUuid: string) =>
    createMessage(content, chatUuid)
  )
  ipcMain.handle('llm:is-running', isRunning)
  ipcMain.handle('llm:serve', (_: IpcMainInvokeEvent, version: SpecificVersion) => serve(version))
  ipcMain.handle('llm:is-downloaded', (_: IpcMainInvokeEvent, version: SpecificVersion) => isDownloaded(version))
  ipcMain.handle('llm:list-downloaded', listDownloaded)
  ipcMain.handle('llm:is-engine-builtin', isEngineBuiltin)
  ipcMain.handle('llm:engine-version', engineVersion)
  ipcMain.handle('llm:get-model-details', (_: IpcMainInvokeEvent, model: string) => getModelDetails(model))
  ipcMain.handle('llm:get-all-model-details', getAllModelDetails)
  ipcMain.handle('llm:has-capability', (_: IpcMainInvokeEvent, model: string, capability: string) =>
    hasCapability(model, capability)
  )
  ipcMain.handle('llm:get-models-by-capability', (_: IpcMainInvokeEvent, capability: string) =>
    getModelsByCapability(capability)
  )
  ipcMain.handle('llm:abort-chat', (_: IpcMainInvokeEvent, chatUuid: string) => abortChat(chatUuid))
  ipcMain.handle('llm:is-chat-active', (_: IpcMainInvokeEvent, chatUuid: string) => isChatActive(chatUuid))
  ipcMain.handle('llm:chat-run', (_: IpcMainInvokeEvent, chatUuid: string) => chatRun(chatUuid))
}

export function useLLMWindow(browserWindow: BrowserWindow): void {
  // Register this window to receive chat state updates
  useActiveChats(browserWindow)

  // Register this window to receive chat thread updates
  useChatRunner(browserWindow)
}
