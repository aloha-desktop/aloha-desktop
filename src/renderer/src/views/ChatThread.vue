<template>
  <div class="flex flex-col w-full h-screen relative">
    <!-- Fixed header area -->
    <PanelHeader class="justify-between border-b px-2">
      <div class="flex items-center gap-2">
        <Button variant="ghost" @click="leftPanelToggle">
          <PanelLeftClose v-show="leftOpen" class="size-4" />
          <PanelLeftOpen v-show="!leftOpen" class="size-4" />
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" @click="rightPanelClose">
          <X class="size-4" />
        </Button>
      </div>
    </PanelHeader>
    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea ref="scrollArea" class="flex-1 min-h-0" watch-scroll @arrived-bottom-change="arrivedBottom = $event">
      <AsyncComponentProvider class="space-y-2 p-2" @resolved="onScrollAreaContentResolve">
        <!-- static messages loaded from the store -->
        <StreamedMessage
          v-for="message in streamedMessages"
          :key="message.uuid"
          :message="message"
          space-filler-class="-mt-2"
          :space-filler-height="message.spaceFillerHeight"
        >
        </StreamedMessage>

        <div v-show="waiting" class="flex my-5 mx-2">
          <TypingIcon />
        </div>

        <template v-if="scrollBehavior === 'instant'" #fallback>
          <div class="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
        </template>
      </AsyncComponentProvider>
    </ScrollArea>
    <!-- Fixed input area -->
    <div class="flex items-end justify-center border-t">
      <Prompt
        v-model="prompt"
        :loading="waiting"
        :abortable="active"
        placeholder="Follow up on this thread..."
        autofocus
        @submit="sendPrompt"
        @abort="onAbort"
      />
    </div>

    <div
      v-show="!arrivedBottom"
      class="absolute bottom-24 left-1/2 -translate-x-1/2 text-gray-500 duration-500 animate-in fade-in-0 fade-out-100"
    >
      <Button
        variant="secondary"
        class="bg-white dark:bg-background dark:hover:bg-accent border border-gray-200 dark:border-gray-600 rounded-full size-8"
        @click="scrollArea?.scrollToBottom('smooth')"
      >
        <ArrowDown class="size-4" />
      </Button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRaw } from 'vue'
import { IpcRendererEvent } from 'electron/renderer'
import { AsyncComponentProvider } from 'vue-async-component-provider'
import { messagesStore } from '@renderer/stores/messages.store'
import { chatsStore } from '@renderer/stores/chats.store'
import { mapStores } from 'pinia'
import { PanelLeftClose, PanelLeftOpen, X, ArrowDown } from 'lucide-vue-next'
import { Button } from '@renderer/components/ui/button'
import PanelHeader from '@renderer/components/PanelHeader.vue'
import { ScrollArea, type ScrollBehavior } from '@renderer/components/ui/scroll-area'
import Prompt from '@renderer/components/Prompt.vue'
import StreamedMessage from '@renderer/components/StreamedMessage.vue'
import TypingIcon from '@renderer/components/TypingIcon.vue'
import { ChatMessage } from '@common/types/chat-message'
import { ToolCall } from 'ollama'
import { toast } from 'vue-sonner'

export default defineComponent({
  name: 'ChatThread',
  components: {
    TypingIcon,
    PanelLeftClose,
    PanelLeftOpen,
    X,
    ArrowDown,
    Button,
    PanelHeader,
    ScrollArea,
    Prompt,
    StreamedMessage,
    AsyncComponentProvider,
  },
  props: {
    leftOpen: {
      type: Boolean,
      default: true,
    },
    rightOpen: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:left-open'],
  data() {
    return {
      waiting: this.$route.query.waiting === 'true',
      active: false,
      prompt: '',
      removeChatMessageListener: () => {},
      removeChatGeneratingListener: () => {},
      removeChatStateChangeListener: () => {},
      scrollBehavior: 'instant' as ScrollBehavior | null,
      streamedMessages: [] as Array<{
        uuid: string
        role: string
        content: string
        thinking?: string | undefined
        thinkingTime?: number | null
        toolCalls?: ToolCall[]
        metadata?: Record<string, unknown> | null
        spaceFillerHeight: number
      }>,
      arrivedBottom: true,
    }
  },
  computed: {
    ...mapStores(messagesStore, chatsStore),
    chatUuid() {
      return this.$route.params.uuid as string
    },
    scrollArea() {
      return this.$refs.scrollArea as InstanceType<typeof ScrollArea> | null
    },
  },
  async mounted() {
    this.removeChatMessageListener = this.$electron.ipcRenderer.on('llm:chat-message', this.onChatMessage)
    this.removeChatGeneratingListener = this.$electron.ipcRenderer.on('llm:chat-generating', this.onChatGenerating)
    this.removeChatStateChangeListener = this.$electron.ipcRenderer.on('llm:chat-state-change', this.onChatStateChange)
    this.active = await this.isChatActive()
    await this.loadThread()
  },
  beforeUnmount() {
    this.removeChatMessageListener()
    this.removeChatGeneratingListener()
    this.removeChatStateChangeListener()
  },
  methods: {
    async onScrollAreaContentResolve() {
      if (this.scrollBehavior) {
        this.scrollArea?.scrollToBottom(this.scrollBehavior)
        this.scrollBehavior = null // reset the scroll behavior after each scroll
      }
    },
    onChatStateChange(_: IpcRendererEvent, chatUuid: string, isActive: boolean) {
      if (chatUuid !== this.chatUuid) {
        return
      }
      this.active = isActive
    },
    onChatGenerating(_: IpcRendererEvent, chatUuid: string) {
      if (chatUuid !== this.chatUuid) {
        return
      }
      this.waiting = true
    },
    onAbort() {
      this.$electron.ipcRenderer.invoke('llm:abort-chat', toRaw(this.chatUuid))
    },
    async isChatActive() {
      return await this.$electron.ipcRenderer.invoke('llm:is-chat-active', toRaw(this.chatUuid))
    },
    onChatMessage(
      _: IpcRendererEvent,
      msg: ChatMessage,
      contentChunks: string[],
      thinkingChunks: string[],
      thinkingTime: number | null,
      newMessage: boolean,
      doneStreaming: boolean,
      toolCalls?: ToolCall[]
    ) {
      if (msg.chatUuid !== this.chatUuid) {
        return
      }

      this.waiting = false

      if (newMessage) {
        this.streamedMessages.push({
          uuid: msg.uuid,
          role: msg.role,
          content: contentChunks.join(''), // join chunks into a single string
          thinking: thinkingChunks.join(''), // join thinking chunks into a single string
          thinkingTime: thinkingTime,
          metadata: msg.metadata,
          spaceFillerHeight: 0,
        })
      } else {
        const lastMsg = this.streamedMessages[this.streamedMessages.length - 1]
        lastMsg.content = contentChunks.join('') // replace with joined chunks
        lastMsg.thinking = thinkingChunks.join('') // replace with joined thinking chunks
        if (thinkingTime) {
          // thinking may be empty but thinkingTime is emitted when done
          lastMsg.thinkingTime = thinkingTime
        }
      }

      if (doneStreaming) {
        const lastMsg = this.streamedMessages[this.streamedMessages.length - 1]
        lastMsg.toolCalls = toolCalls // tool calls are emitted only when done
        this.chatsStore.listChats()
      }
    },
    async loadThread() {
      await this.messagesStore.listMessages(this.chatUuid)
      this.streamedMessages = this.messagesStore.messages.map((message) => ({
        uuid: message.uuid,
        role: message.role,
        content: message.content,
        thinking: message.thinking,
        thinkingTime: message.thinkingTime,
        toolCalls: message.toolCalls,
        metadata: message.metadata,
        spaceFillerHeight: 0,
      }))
    },
    async sendPrompt() {
      if (!this.prompt) {
        toast('Talk to me, Goose ✈️')
        return
      }

      try {
        this.waiting = true // flag cleared in onChatMessage
        const userPrompt = this.prompt
        this.prompt = ''
        this.scrollBehavior = 'smooth' // only first one is instant, any subsequent ones are smooth

        const newUserMessage = await this.$electron.ipcRenderer.invoke(
          'llm:create-message',
          toRaw(userPrompt),
          toRaw(this.chatUuid)
        )
        this.chatsStore.listChats() // async to load the new message from the user in the chat list

        const vpHeight = await this.scrollArea?.getViewportHeight()
        this.streamedMessages.push({
          uuid: newUserMessage.uuid,
          role: newUserMessage.role,
          content: newUserMessage.content,
          spaceFillerHeight: vpHeight || 0,
        })
        await this.$electron.ipcRenderer.invoke('llm:chat-run', toRaw(this.chatUuid))
      } catch (error) {
        toast.error('Failed to send the prompt :(', {
          description: error instanceof Error ? error.message : 'Try restarting the app if the problem persists.',
        })
        console.error(error)
      }
    },
    leftPanelToggle() {
      this.$emit('update:left-open', !this.leftOpen)
    },
    rightPanelClose() {
      if (!this.leftOpen) {
        this.$emit('update:left-open', true)
      }
      this.$router.push('/chats')
    },
  },
})
</script>
