<template>
  <div
    id="install-ai"
    class="bg-black fixed left-0 top-0 z-25 flex justify-center items-start h-screen w-full text-center p-6 gap-10"
  >
    <!-- Full screen video background -->
    <video class="absolute bottom-0 left-0 max-h-[65%] w-full z-0" autoplay loop muted playsinline>
      <source src="../assets/dancer-1500.mp4" type="video/mp4" />
    </video>

    <!-- Content overlay -->
    <div class="relative z-10 flex">
      <!-- Header with logos and caption -->
      <div class="flex flex-col items-center justify-center gap-1">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2">
            <img src="../assets/logo.png" alt="Aloha Logo" class="w-full h-full object-contain" />
          </div>
          <div class="text-2xl font-bold text-muted-foreground">+</div>
          <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2">
            <img src="../assets/ollama.png" alt="Ollama Logo" class="w-full h-full object-contain" />
          </div>
        </div>
        <h2 class="text-lg font-medium text-white">{{ onHoldMessage }}</h2>
        <p class="text-sm text-muted-foreground">This may take a few minutes. Please don't close this window.</p>
        <Progress
          v-if="engineServeProgress"
          :model-value="engineServeProgress.progress"
          class="bg-accent/30 mt-3"
          indicator-class="bg-accent"
        />
        <Progress
          v-else-if="modelPullProgress"
          :model-value="modelPullProgress.progress"
          class="bg-accent/30 mt-3"
          indicator-class="bg-accent"
        />
        <Progress
          v-else-if="corePluginsProgress"
          :model-value="corePluginsProgress.progress"
          class="bg-accent/30 mt-3"
          indicator-class="bg-accent"
        />
        <div v-else class="flex justify-center items-center mt-3 text-white">
          <LoaderPinwheel class="size-6 animate-spin" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { LoaderPinwheel } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { defaultVersion } from '@renderer/lib/ollama'
import { ProgressStatus } from '@common/types/progress'
import { IpcRendererEvent } from 'electron/renderer'
import Progress from '@renderer/components/ui/progress/Progress.vue'

export default defineComponent({
  name: 'InstallAI',
  components: {
    LoaderPinwheel,
    Progress,
  },
  data() {
    return {
      onHoldMessage: 'Please wait...',
      corePlugins: ['aloha-desktop/aloha-internet-search', 'aloha-desktop/aloha-visit-website'],
      engineServeProgress: null as ProgressStatus | null,
      modelPullProgress: null as ProgressStatus | null,
      corePluginsProgress: null as ProgressStatus | null,
      removeProgressListener: () => {},
    }
  },
  async mounted() {
    this.engineServeProgress = await this.$electron.ipcRenderer.invoke('progress:status', 'llm-engine-serve')
    this.modelPullProgress = await this.$electron.ipcRenderer.invoke('progress:status', 'llm-pull-model')
    this.removeProgressListener = this.$electron.ipcRenderer.on('progress:update', this.onProgressUpdate)
    await this.init()
  },
  beforeUnmount() {
    this.removeProgressListener()
  },
  methods: {
    async init() {
      try {
        if (!this.$route.query.modelOnly) {
          this.onHoldMessage = 'Downloading Ollama AI engine...'
          await this.$nextTick()
          await this.$electron.ipcRenderer.invoke('llm:serve', defaultVersion)
        }

        this.onHoldMessage = 'Downloading AI model...'
        await this.$nextTick()
        const defaultModel = await this.$electron.ipcRenderer.invoke('llm:get-default-model')
        if (!defaultModel) {
          toast('Model not selected', {
            description: 'Please choose the model from the dropdown.',
          })
          return this.$router.push('/configure-ai')
        }

        if (!this.modelPullProgress) {
          // if a model is not being pulled already
          console.log('Pulling model', defaultModel)
          await this.$electron.ipcRenderer.invoke('llm:pull-model', defaultModel)
        } else {
          console.log('Model already being pulled')
        }

        // resolution is now delegated to the progress listener
      } catch (error) {
        toast.error('Failed to start Ollama AI engine', {
          description: error instanceof Error ? error.message : undefined,
        })
        this.$router.push('/configure-ai')
      }
    },
    async tryInstallCorePlugins() {
      this.onHoldMessage = 'Installing core plugins...'
      this.corePluginsProgress = { progress: 0, done: false, resourceValue: 'core-plugins' }
      await this.$nextTick()

      const availablePlugins = await this.$electron.ipcRenderer.invoke('plugins:available-plugins')
      const increment = 100 / this.corePlugins.length

      for (const plugin of this.corePlugins) {
        try {
          this.corePluginsProgress.progress += increment
          await this.$nextTick()

          const [, repoName] = plugin.split('/')
          if (!availablePlugins.includes(repoName)) {
            await this.$electron.ipcRenderer.invoke('plugins:install', plugin)
          }
        } catch (error) {
          console.error('Failed to install core plugin', plugin, error)
        }
      }

      this.corePluginsProgress.progress = 100
      await this.$nextTick()

      this.success()
    },
    success() {
      this.$router.push('/setup')
    },
    async onProgressUpdate(_: IpcRendererEvent, resourceKey: string, progressStatus: ProgressStatus) {
      if (resourceKey === 'llm-engine-serve') {
        this.engineServeProgress = !progressStatus.done ? progressStatus : null

        if (progressStatus.progress === 100) {
          // 100% downloaded but not done yet
          this.onHoldMessage = 'Starting Ollama AI engine...'
          await this.$nextTick()
        }
      }

      if (resourceKey === 'llm-pull-model') {
        this.modelPullProgress = !progressStatus.done ? progressStatus : null

        if (progressStatus.done) {
          this.tryInstallCorePlugins()
        }
      }
    },
  },
})
</script>
