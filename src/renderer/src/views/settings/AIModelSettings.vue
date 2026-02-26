<script lang="ts">
import { defineComponent } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { ListResponse } from 'ollama'
import SettingsHeader from '@renderer/components/SettingsHeader.vue'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import AIModelItem from '../../components/AIModelItem.vue'
import { Store } from 'lucide-vue-next'

export default defineComponent({
  name: 'AIModelSettings',
  components: {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Skeleton,
    SettingsHeader,
    AIModelItem,
    Store,
    ScrollArea,
  },
  data() {
    return {
      currentModel: '',
      availableModels: [] as ListResponse['models'],
      loadingDefaultModel: false,
      loadingModels: false,
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      await Promise.all([this.loadCurrentModel(), this.loadAvailableModels()])
    },
    async loadCurrentModel() {
      this.loadingDefaultModel = true
      try {
        this.currentModel = await this.$electron.ipcRenderer.invoke('llm:get-default-model')
      } catch (error) {
        console.error('Failed to load current model:', error)
      } finally {
        this.loadingDefaultModel = false
      }
    },
    async loadAvailableModels() {
      this.loadingModels = true
      try {
        const response = await this.$electron.ipcRenderer.invoke('llm:list-models')
        this.availableModels = response.models || []
      } catch (error) {
        console.error('Failed to load available models:', error)
        this.availableModels = []
      } finally {
        this.loadingModels = false
      }
    },
    async setDefaultModel(modelName: string) {
      this.loadingDefaultModel = true
      try {
        await this.$electron.ipcRenderer.invoke('llm:set-default-model', modelName)
        this.currentModel = await this.$electron.ipcRenderer.invoke('llm:get-default-model')
      } catch (error) {
        console.error('Failed to set default model:', error)
      } finally {
        this.loadingDefaultModel = false
      }
    },
  },
})
</script>

<template>
  <div id="ai-model-settings" class="flex flex-col h-screen w-full">
    <SettingsHeader :breadcrumb-root="{ title: 'AI', url: '/settings' }" breadcrumb-title="Model" />
    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="flex flex-1 flex-col gap-4 p-4">
        <!-- Currently Selected Model Section -->
        <Card>
          <CardHeader>
            <CardTitle>Currently Selected Model</CardTitle>
            <CardDescription>
              <div v-if="loadingDefaultModel" class="flex items-center gap-2">
                <Skeleton class="h-4 w-32" />
              </div>
              <div v-else-if="currentModel" class="flex items-center gap-2">
                {{ currentModel }}
              </div>
              <div v-else class="text-muted-foreground">No model selected</div>
            </CardDescription>
          </CardHeader>
        </Card>

        <!-- Local Models Section -->
        <Card>
          <CardHeader>
            <CardTitle>Local Models</CardTitle>
          </CardHeader>
          <CardContent class="px-4">
            <div v-if="loadingModels" class="space-y-2">
              <Skeleton class="h-8 w-full" />
              <Skeleton class="h-8 w-full" />
              <Skeleton class="h-8 w-full" />
            </div>
            <div v-else-if="availableModels.length > 0" class="space-y-2">
              <AIModelItem
                v-for="model in availableModels"
                :key="model.name"
                :model="model"
                :is-current="model.name === currentModel"
                :loading="loadingDefaultModel"
                @set-default="setDefaultModel"
              />
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No models available. Make sure the AI engine is running.
            </div>
          </CardContent>
        </Card>

        <!-- Download Models Link -->
        <div class="flex justify-center mt-4">
          <Button variant="ghost" class="text-muted-foreground" @click="$router.push('/settings/ai-model-pull')">
            <Store class="size-4" />
            Find more on Models Marketplace
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
