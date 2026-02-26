import { defineStore } from 'pinia'
import { ChatListItem } from '@common/types/chat'

export const chatsStore = defineStore('chats', {
  state: () => ({
    chats: [] as ChatListItem[],
  }),
  actions: {
    async listChats() {
      this.chats = await this.$electron.ipcRenderer.invoke('llm:list-chats')
    },
    updateChatName(chatUuid: string, title: string) {
      this.chats = this.chats.map((chat) => (chat.uuid === chatUuid ? { ...chat, name: title } : chat))
    },
  },
})
