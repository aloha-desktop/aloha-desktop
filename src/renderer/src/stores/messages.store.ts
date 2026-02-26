import { defineStore } from 'pinia'
import { ChatMessage } from '@common/types/chat-message'
import { toRaw } from 'vue'

export const messagesStore = defineStore('messages', {
  state: () => ({
    messages: [] as ChatMessage[],
  }),
  actions: {
    async listMessages(chatUuid: string) {
      this.messages = await this.$electron.ipcRenderer.invoke('llm:list-messages', toRaw(chatUuid))
    },
  },
})
