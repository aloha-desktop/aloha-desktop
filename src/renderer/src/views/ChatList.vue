<template>
  <div class="flex flex-col w-full h-screen bg-sidebar">
    <!-- Fixed header area -->
    <PanelHeader class="border-b">
      <h2 class="text-lg font-semibold">Chats</h2>
    </PanelHeader>
    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea ref="scrollArea" class="flex-1 min-h-0">
      <Button
        v-for="chat in chats"
        :key="chat.uuid"
        class="flex flex-col items-start gap-1 w-full hover:bg-muted px-4 py-3 whitespace-normal"
        :class="{
          'bg-muted': activeThreadUuid === chat.uuid,
        }"
        variant="ghost"
        size="auto"
        rounded="none"
        @click="$router.push({ name: 'chat-thread', params: { uuid: chat.uuid } })"
      >
        <div class="line-clamp-1 text-left">
          <div>{{ chat.name || 'No name' }}</div>
        </div>
        <div class="text-xs text-muted-foreground">{{ chat.messageCount }} messages</div>
      </Button>
    </ScrollArea>
    <!-- Fixed input area -->
    <div class="flex items-end justify-center border-t">
      <Prompt v-model="prompt" :loading="loading" placeholder="Ask me anything..." autofocus @submit="sendPrompt" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRaw } from 'vue'
import Prompt from '@renderer/components/Prompt.vue'
import { chatsStore } from '@renderer/stores/chats.store'
import { mapState, mapStores } from 'pinia'
import { Button } from '@renderer/components/ui/button'
import PanelHeader from '@renderer/components/PanelHeader.vue'
import { ScrollArea, type ScrollBehavior } from '@renderer/components/ui/scroll-area'
import { toast } from 'vue-sonner'
import { IpcRendererEvent } from 'electron/renderer'

export default defineComponent({
  name: 'ChatList',
  components: {
    Prompt,
    Button,
    PanelHeader,
    ScrollArea,
  },
  props: {
    leftOpen: {
      type: Boolean,
      default: true,
    },
    rightOpen: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      prompt: '',
      loading: false,
      removeChatTitleListener: () => {},
      removeChatListChangedListener: () => {},
    }
  },
  computed: {
    ...mapStores(chatsStore),
    ...mapState(chatsStore, ['chats']),
    activeThreadUuid() {
      return this.$route.name === 'chat-thread' && this.$route.params.uuid
    },
    scrollArea() {
      return this.$refs.scrollArea as InstanceType<typeof ScrollArea> | null
    },
  },
  mounted() {
    this.loadAndScroll('instant')
    this.removeChatTitleListener = this.$electron.ipcRenderer.on('llm:chat-title', this.onChatTitle)
    this.removeChatListChangedListener = this.$electron.ipcRenderer.on('llm:chat-list-changed', this.onChatListChanged)
  },
  beforeUnmount() {
    this.removeChatTitleListener()
    this.removeChatListChangedListener()
  },
  methods: {
    onChatTitle(_: IpcRendererEvent, chatUuid: string, title: string) {
      this.chatsStore.updateChatName(chatUuid, title)
    },
    async onChatListChanged() {
      await this.chatsStore.listChats()
    },
    async loadAndScroll(scrollBehavior: ScrollBehavior) {
      await this.chatsStore.listChats()
      this.scrollArea?.scrollToBottom(scrollBehavior)
    },
    async sendPrompt() {
      if (!this.prompt) {
        toast('Talk to me, Goose ✈️')
        return
      }

      try {
        this.loading = true
        const userPrompt = this.prompt
        this.prompt = ''
        const chat = await this.$electron.ipcRenderer.invoke('llm:create-chat', toRaw(userPrompt))

        if (!chat) {
          throw new Error('Failed to create chat')
        }

        this.loadAndScroll('smooth') // async load the new chat
        this.$router.push({ name: 'chat-thread', params: { uuid: chat.uuid }, query: { waiting: 'true' } })
        this.$electron.ipcRenderer.invoke('llm:chat-run', toRaw(chat.uuid)) // async run the chat, but don't wait for it
      } catch (error) {
        toast.error('Failed to send the prompt :(', {
          description: error instanceof Error ? error.message : 'Try restarting the app if the problem persists.',
        })
        console.error(error)
      } finally {
        this.loading = false
      }
    },
  },
})
</script>
