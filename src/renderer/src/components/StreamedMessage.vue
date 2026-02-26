<template>
  <div class="markdown-message" v-bind="$attrs">
    <div
      :class="`markdown-message-space-filler float-left w-1 -ml-1 ${spaceFillerClass}`"
      :style="{ minHeight: `${spaceFillerHeight}px` }"
    >
      <!-- filler -->
    </div>
    <div
      v-if="message.role === 'user'"
      class="flex w-max max-w-[75%] rounded-lg px-3 mt-2 mb-2 text-sm ml-auto mr-2 bg-primary text-primary-foreground select-text leading-relaxed"
    >
      <Markdown :content="message.content" />
    </div>
    <div
      v-else-if="message.role === 'tool'"
      class="flex flex-col mx-2 text-sm select-text leading-relaxed overflow-x-hidden"
    >
      <ToolCallMessage :title="`Used ${message.metadata?.displayName || ''}`" :content="message.content">
        <template #icon>
          <ToolIcon :tool-name="`${message.metadata?.name || ''}`" />
        </template>
      </ToolCallMessage>
    </div>
    <div v-else class="flex flex-col mx-2 gap-2 text-sm select-text leading-relaxed overflow-x-hidden">
      <ToolCallMessage
        v-if="message.thinking"
        :title="formatThinkingTime(message.thinkingTime)"
        :content="message.thinking"
        content-class="text-muted-foreground"
      >
        <template #icon>
          <Avatar>
            <Brain class="size-5" />
          </Avatar>
        </template>
      </ToolCallMessage>
      <Markdown v-if="message.content" :content="message.content" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { Avatar } from '@renderer/components/ui/avatar'
import { Brain } from 'lucide-vue-next'
import Markdown from '@renderer/components/Markdown.vue'
import ToolCallMessage from '@renderer/components/ToolCallMessage.vue'
import ToolIcon from '@renderer/components/ToolIcon.vue'
import { ToolCall } from 'ollama'

export default defineComponent({
  components: {
    Avatar,
    Markdown,
    ToolCallMessage,
    ToolIcon,
    Brain,
  },
  props: {
    message: {
      type: Object as PropType<{
        uuid: string
        role: string
        content: string
        thinking?: string | undefined
        thinkingTime?: number | null
        toolCalls?: ToolCall[]
        metadata?: Record<string, unknown> | null
      }>,
      required: true,
    },
    spaceFillerHeight: {
      type: Number,
      required: false,
      default: 0,
    },
    spaceFillerClass: {
      type: String,
      required: false,
      default: '',
    },
  },
  methods: {
    formatThinkingTime(thinkingTime: number | null | undefined) {
      if (!thinkingTime) return 'Thinking...'
      return `Thinking for ${(thinkingTime / 1000).toFixed(0)}s`
    },
  },
})
</script>
