<template>
  <div
    class="setup-background fixed left-0 top-0 z-25 flex flex-col justify-center items-center h-screen w-full text-center p-4 gap-2"
  >
    <div class="w-12 h-12 rounded-lg flex items-center justify-center p-2">
      <img src="../assets/logo.png" alt="Aloha Logo" class="w-full h-full object-contain" />
    </div>
    <h1 class="text-2xl font-bold aloha">Aloha!</h1>
    <div class="text-sm text-muted-foreground">{{ onHoldMessage }}</div>
    <div v-if="loading" class="flex justify-center items-center mt-5">
      <LoaderPinwheel class="size-6 animate-spin text-white" />
    </div>
    <AppError v-if="!loading && lastError" :error="lastError" title="There was an error setting up the app..." />
  </div>
</template>

<script lang="ts">
import { defineComponent, toRaw } from 'vue'
import { LoaderPinwheel } from 'lucide-vue-next'
import AppError from '@renderer/components/AppError.vue'
import { defaultVersion } from '@renderer/lib/ollama'
import { ModelResponse } from 'ollama'

export default defineComponent({
  components: { LoaderPinwheel, AppError },
  data() {
    return {
      loading: true,
      standalone: this.$route.query.standalone, // user claims to have standalone Ollama engine
      lastError: '',
      onHoldMessage: 'Please wait while we set up the app...',
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    async success() {
      const skipWelcome = await this.$electron.ipcRenderer.invoke('setup:skip-welcome')

      if (skipWelcome) {
        this.$router.push('/home')
        return
      }

      try {
        await this.$electron.ipcRenderer.invoke('setup:set-skip-welcome', true)
        await this.sendWelcomePrompt()
      } catch (exc) {
        console.error('Failed to send welcome prompt', exc)
        this.$router.push('/home')
      }
    },
    async sendWelcomePrompt() {
      const welcomePrompt = 'Describe the tools you have available and how the user can use them.'
      const chat = await this.$electron.ipcRenderer.invoke('llm:create-chat', toRaw(welcomePrompt))

      if (!chat) {
        throw new Error('Failed to create chat')
      }

      this.$router.push({ name: 'chat-thread', params: { uuid: chat.uuid }, query: { waiting: 'true' } })
      this.$electron.ipcRenderer.invoke('llm:chat-run', toRaw(chat.uuid)) // async run the chat, but don't wait for it
    },
    async init() {
      try {
        this.onHoldMessage = 'Initializing database...'
        await this.$nextTick()
        await this.$electron.ipcRenderer.invoke('storage:initialize')

        this.onHoldMessage = 'Loading plugins...'
        await this.$nextTick()
        await this.$electron.ipcRenderer.invoke('plugins:load-enabled-plugins')

        this.onHoldMessage = 'Initializing gateway...'
        await this.$nextTick()
        await this.$electron.ipcRenderer.invoke('gateway:initialize')

        this.onHoldMessage = 'Loading AI...'
        await this.$nextTick()
        const isRunning = await this.$electron.ipcRenderer.invoke('llm:is-running')
        if (!isRunning) {
          const isDownloaded = await this.$electron.ipcRenderer.invoke('llm:is-downloaded', defaultVersion)
          if (!isDownloaded) {
            // not running, not downloaded, show configure screen
            return this.$router.push({
              path: '/configure-ai',
              query: { standalone: this.standalone }, // send back to ConfigureAI with standalone flag
            })
          }

          await this.$electron.ipcRenderer.invoke('llm:serve', defaultVersion)
        }

        const defaultModel = await this.$electron.ipcRenderer.invoke('llm:get-default-model')
        if (!defaultModel) {
          return this.$router.push({
            path: '/configure-ai',
            query: { standalone: this.standalone }, // send back to ConfigureAI with standalone flag
          })
        }

        const list = await this.$electron.ipcRenderer.invoke('llm:list-models')
        if (!list.models.find((model: ModelResponse) => model.name === defaultModel)) {
          return this.$router.push({
            path: '/install-ai',
            query: { modelOnly: 'true' },
          })
        }

        await this.success()
      } catch (exc) {
        console.error(exc)
        this.lastError = `${exc}`
      } finally {
        this.loading = false
      }
    },
  },
})
</script>
