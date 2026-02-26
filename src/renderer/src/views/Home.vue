<script lang="ts">
import { defineComponent, toRaw } from 'vue'
import Prompt from '@renderer/components/Prompt.vue'
import { toast } from 'vue-sonner'

export default defineComponent({
  name: 'Home',
  components: {
    Prompt,
  },
  data() {
    return {
      prompt: '',
      loading: false,
    }
  },
  methods: {
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

        this.$router.push({ name: 'chat-thread', params: { uuid: chat.uuid }, query: { waiting: 'true' } })
        await this.$electron.ipcRenderer.invoke('llm:chat-run', toRaw(chat.uuid))
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

<template>
  <div class="flex h-screen w-full items-center justify-center">
    <div class="flex flex-col items-center gap-6 w-[75%]">
      <h1 class="text-2xl font-bold text-center"><span class="aloha">Aloha!</span><br />How can I help you today?</h1>
      <Prompt
        v-model="prompt"
        placeholder="Ask me anything..."
        class="border-1 border-gray-200 dark:border-gray-600 rounded-lg p-2"
        autofocus
        @submit="sendPrompt"
      />
    </div>
  </div>
</template>
