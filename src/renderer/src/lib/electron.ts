import type { App } from 'vue'
import type { ElectronAPI, IpcRenderer } from '@electron-toolkit/preload'
import { Chat, ChatListItem } from '@common/types/chat'
import { ChatMessage } from '@common/types/chat-message'
import { ToolCall, ListResponse } from 'ollama'
import { SpecificVersion } from 'electron-ollama'
import { IpcRendererEvent } from 'electron'
import { ProgressStatus } from '@common/types/progress'
import { AIModel } from '@common/types/ai-model'
import { ModelDetails } from '@common/types/model-capability'

export interface AgentElectronAPI extends ElectronAPI {
  ipcRenderer: IpcRenderer & {
    invoke(channel: 'llm:list-models'): Promise<ListResponse>
    invoke(channel: 'llm:fetch-models'): Promise<AIModel[]>
    invoke(channel: 'llm:set-default-model', model: string): Promise<void>
    invoke(channel: 'llm:get-default-model'): Promise<string>
    invoke(channel: 'llm:pull-model', model: string): Promise<void>
    invoke(channel: 'llm:list-chats'): Promise<ChatListItem[]>
    invoke(channel: 'llm:list-messages', chatUuid: string): Promise<ChatMessage[]>
    invoke(channel: 'llm:create-chat', prompt: string): Promise<Chat | undefined>
    invoke(channel: 'llm:create-message', content: string, chatUuid: string): Promise<ChatMessage>
    invoke(channel: 'llm:chat-run', chatUuid: string): Promise<void>
    invoke(channel: 'llm:is-running'): Promise<boolean>
    invoke(channel: 'llm:serve', version: SpecificVersion): Promise<void>
    invoke(channel: 'llm:is-downloaded', version: SpecificVersion): Promise<boolean>
    invoke(channel: 'llm:is-engine-builtin'): Promise<boolean>
    invoke(channel: 'llm:engine-version'): Promise<string>
    invoke(channel: 'llm:get-model-capabilities', model: string): Promise<ModelDetails>
    invoke(channel: 'llm:get-all-model-capabilities'): Promise<ModelDetails[]>
    invoke(channel: 'llm:has-capability', model: string, capability: string): Promise<boolean>
    invoke(channel: 'llm:get-models-by-capability', capability: string): Promise<ModelDetails[]>
    invoke(channel: 'plugins:available-plugins'): Promise<string[]>
    invoke(channel: 'plugins:install', plugin: string): Promise<void>
    invoke(channel: 'progress:status', resourceKey: string): Promise<ProgressStatus | null>
    invoke(channel: 'progress:test', resourceKey: string): Promise<void>
    invoke(channel: 'updater:status'): Promise<string>
    invoke(channel: 'updater:check-for-updates'): Promise<void>
    invoke(channel: 'setup:skip-welcome'): Promise<boolean>
    invoke(channel: 'setup:set-skip-welcome', isSkipWelcome: boolean): Promise<void>
    on(
      channel: 'llm:chat-message',
      listener: (
        event: IpcRendererEvent,
        chatMessage: ChatMessage,
        contentChunks: string[],
        thinkingChunks: string[],
        thinkingTime: number | null,
        newMessage: boolean,
        doneStreaming: boolean,
        toolCalls?: ToolCall[]
      ) => void
    ): () => void
    on(
      channel: 'llm:chat-title',
      listener: (event: IpcRendererEvent, chatUuid: string, title: string) => void
    ): () => void
    on(
      channel: 'llm:chat-state-change',
      listener: (event: IpcRendererEvent, chatUuid: string, isActive: boolean) => void
    ): () => void
    on(
      channel: 'progress:update',
      listener: (event: IpcRendererEvent, resourceKey: string, progressStatus: ProgressStatus) => void
    ): () => void
    on(channel: 'updater:on-status-change', listener: (event: IpcRendererEvent, status: string) => void): () => void
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $electron: AgentElectronAPI
  }
}

export const electron = {
  install(app: App) {
    app.config.globalProperties.$electron = window.electron
  },
}
