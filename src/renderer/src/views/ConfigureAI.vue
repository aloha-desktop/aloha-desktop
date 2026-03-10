<template>
  <div
    id="configure-ai"
    class="setup-background fixed left-0 top-0 z-25 flex flex-col justify-center items-center h-screen w-full text-center p-4 gap-10"
  >
    <!-- Header with logos and caption -->
    <div class="flex flex-col items-center justify-center">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2">
          <img src="../assets/logo.png" alt="Aloha Logo" class="w-full h-full object-contain" />
        </div>
        <div class="text-2xl font-bold text-muted-foreground">+</div>
        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2">
          <img src="../assets/ollama.png" alt="Ollama Logo" class="w-full h-full object-contain" />
        </div>
      </div>
      <h2 class="text-lg font-medium text-white">Aloha uses Ollama AI engine</h2>
    </div>

    <div v-if="loading" class="flex justify-center items-center mt-5 text-white">
      <LoaderPinwheel class="size-6 animate-spin" />
    </div>

    <!-- Main content area -->
    <div v-else class="flex flex-col items-center justify-center">
      <!-- Option A: Default option with bigger outline button -->
      <div class="mb-4">
        <Button
          variant="outline"
          size="lg"
          class="text-lg font-medium text-accent-foreground border-2 hover:bg-accent/90"
          :disabled="loading"
          @click="selectBuiltInOllama"
        >
          Use built-in Ollama AI engine (recommended)
          <ArrowRight class="size-4" />
        </Button>
      </div>

      <!-- Model Selection Dropdown -->
      <div class="mb-10 flex items-center justify-center text-muted-foreground text-sm gap-1">
        <span>with</span>
        <span>model</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              class="justify-between bg-transparent dark:hover:bg-transparent dark:bg-transparent border-none enabled:hover:bg-transparent enabled:hover:border-none enabled:hover:text-white !p-0"
              :disabled="loading"
            >
              <span>{{ selectedModel || 'Choose a model...' }}</span>
              <ChevronDown class="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" class="w-[200px]">
            <DropdownMenuLabel>AI Model</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="model in availableModels"
              :key="model"
              :class="{ 'bg-accent': selectedModel === model }"
              @click="selectedModel = model"
            >
              <span class="text-sm">{{ model }}</span>
              <Check v-if="selectedModel === model" class="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="availableModels.length === 0" />
            <DropdownMenuItem v-if="availableModels.length === 0" disabled>
              <span class="text-sm text-muted-foreground">No models available</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Option B: Small text option -->
      <div class="absolute bottom-5">
        <button
          :disabled="loading"
          class="text-sm text-muted-foreground transition-colors enabled:hover:text-white"
          @click="selectStandaloneOllama"
        >
          I have just started standalone Ollama engine
        </button>
        <div class="text-xs text-muted-foreground mt-4">
          By using this app, you accept the
          <a
            href="https://github.com/aloha-desktop/aloha-desktop/blob/main/LICENSE"
            target="_blank"
            class="text-muted-foreground hover:text-white"
            >End User License Agreement</a
          >.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import modelsFallback from '../../../../resources/models.json'
import { ArrowRight, ChevronDown, Check } from 'lucide-vue-next'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'
import { LoaderPinwheel } from 'lucide-vue-next'

export default defineComponent({
  name: 'ConfigureAI',
  components: {
    Button,
    ArrowRight,
    ChevronDown,
    Check,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    LoaderPinwheel,
  },
  data() {
    return {
      availableModels: [] as string[],
      selectedModel: '',
      loading: false,
    }
  },
  async mounted() {
    if (this.$route.query.standalone === 'true') {
      toast.error('Standalone Ollama server is not running', {
        description: 'Please start your standalone Ollama server or use the built-in Ollama engine.',
      })
    }

    // Load available models
    await this.loadModels()
  },
  methods: {
    async loadModels() {
      this.loading = true

      try {
        const models = await this.$electron.ipcRenderer.invoke('llm:fetch-models')
        this.availableModels = this.flattenModels(models) || []
      } catch (error) {
        console.error('Error loading models, using fallback', error)
        this.availableModels = this.flattenModels(modelsFallback) || []
      }

      try {
        this.selectedModel = await this.$electron.ipcRenderer.invoke('llm:get-default-model')
      } catch (error) {
        console.error('Error getting default model', error)
        this.selectedModel = ''
      }

      if (!this.selectedModel && this.availableModels.length > 0) {
        this.selectedModel = this.availableModels[0]
      }

      this.loading = false
    },
    flattenModels(modelsData: typeof modelsFallback): string[] {
      const flatModels: string[] = []

      for (const model of modelsData) {
        for (const tag of model.tags) {
          flatModels.push(`${model.name}:${tag.name}`)
        }
      }

      return flatModels
    },
    async saveDefaultModel() {
      try {
        await this.$electron.ipcRenderer.invoke('llm:set-default-model', this.selectedModel)
      } catch (error) {
        console.error('Error saving default model', error)
        toast.error('Something went wrong while saving the default model', {
          description: 'Please restart the app and try again.',
        })
      }
    },
    async selectBuiltInOllama() {
      await this.saveDefaultModel()
      this.$router.push({ path: '/install-ai' })
    },
    async selectStandaloneOllama() {
      await this.saveDefaultModel()
      this.$router.push({ path: '/setup', query: { standalone: 'true' } })
    },
  },
})
</script>
