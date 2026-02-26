<template>
  <div id="ai-model-pull-settings" class="flex flex-col h-screen w-full">
    <SettingsHeader :breadcrumb-root="{ title: 'AI', url: '/settings' }" breadcrumb-title="Models Marketplace" />
    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="flex flex-1 flex-col gap-4 p-4">
        <!-- Download Progress Card -->
        <Card v-if="modelPullProgress">
          <CardHeader>
            <CardTitle> Downloading {{ modelPullProgress.resourceValue }} </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress :model-value="modelPullProgress.progress" />
          </CardContent>
        </Card>

        <!-- Models Table -->
        <Card>
          <CardHeader>
            <CardTitle>Available AI Models</CardTitle>
            <CardDescription> Supported by Aloha Desktop </CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Loading Skeleton -->
            <div v-if="loading || loadingLocalModels" class="space-y-3">
              <div v-for="i in 8" :key="i" class="flex items-center space-x-4">
                <Skeleton class="h-4 w-[70px]" />
                <Skeleton class="h-4 w-[250px]" />
                <Skeleton class="h-4 w-[70px]" />
                <Skeleton class="h-4 w-[70px]" />
              </div>
            </div>

            <!-- Models Table -->
            <div v-else-if="models.length > 0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <template v-for="model in models" :key="model.name">
                    <TableRow v-for="tag in model.tags" :key="`${model.name}-${tag.name}`">
                      <TableCell class="font-medium">{{ model.name }}</TableCell>
                      <TableCell class="flex items-center gap-2">
                        <div>{{ tag.name }}</div>
                        <div v-if="'guidance' in tag" class="flex items-center gap-1">
                          <Tooltip :content="tag.guidance" side="top">
                            <Info class="size-3.5 text-muted-foreground cursor-help" />
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>{{ model.description }}</TableCell>
                      <TableCell class="h-12">
                        <div v-if="isModelDownloaded(model.name, tag.name)" class="flex items-center gap-2">
                          <Check class="size-4 text-green-600" />
                          <span class="text-sm text-muted-foreground">Downloaded</span>
                        </div>
                        <Button
                          v-else
                          size="xs"
                          :disabled="modelPullProgress !== null"
                          @click="downloadModel(`${model.name}:${tag.name}`)"
                        >
                          <Download class="size-3 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  </template>
                </TableBody>
              </Table>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8 text-muted-foreground">
              <p>No models available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IpcRendererEvent } from 'electron/renderer'
import { ProgressStatus } from '@common/types/progress'
import { AIModel } from '@common/types/ai-model'
import { ListResponse } from 'ollama'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Check, Download, Info } from 'lucide-vue-next'
import SettingsHeader from '@renderer/components/SettingsHeader.vue'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Tooltip } from '@renderer/components/ui/tooltip'

export default defineComponent({
  name: 'AIModelPullSettings',
  components: {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Button,
    Progress,
    Skeleton,
    Check,
    Download,
    Info,
    SettingsHeader,
    ScrollArea,
    Tooltip,
  },
  data() {
    return {
      models: [] as AIModel[],
      localModels: [] as ListResponse['models'],
      loading: true,
      loadingLocalModels: false,
      modelPullProgress: null as ProgressStatus | null,
      removeProgressListener: () => {},
    }
  },
  async mounted() {
    this.removeProgressListener = this.$electron.ipcRenderer.on('progress:update', this.onProgressUpdate)
    await this.loadData()
  },
  beforeUnmount() {
    this.removeProgressListener()
  },
  methods: {
    async loadData() {
      await Promise.all([this.fetchModels(), this.loadLocalModels()])
    },
    async fetchModels() {
      try {
        this.loading = true
        this.models = await this.$electron.ipcRenderer.invoke('llm:fetch-models')
      } catch (error) {
        toast.error('Failed to fetch models', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        })
      } finally {
        this.loading = false
      }
    },
    async loadLocalModels() {
      try {
        this.loadingLocalModels = true
        const response = await this.$electron.ipcRenderer.invoke('llm:list-models')
        this.localModels = response.models || []
      } catch (error) {
        console.error('Failed to load local models:', error)
        this.localModels = []
      } finally {
        this.loadingLocalModels = false
      }
    },
    isModelDownloaded(modelName: string, tagName: string): boolean {
      const fullModelName = `${modelName}:${tagName}`
      return this.localModels.some((model) => model.name === fullModelName)
    },
    async downloadModel(modelName: string) {
      try {
        toast.success(`Started downloading ${modelName}`)
        await this.$electron.ipcRenderer.invoke('llm:pull-model', modelName)
      } catch (error) {
        toast.error(`Failed to start download for ${modelName}`, {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        })
      }
    },
    async onProgressUpdate(_: IpcRendererEvent, resourceKey: string, progressStatus: ProgressStatus) {
      if (resourceKey === 'llm-pull-model') {
        this.modelPullProgress = !progressStatus.done ? progressStatus : null

        if (progressStatus.done) {
          toast.success(`Successfully downloaded ${progressStatus.resourceValue}`)
          // Refresh the models list to show updated status
          await this.loadLocalModels()
        }
      }
    },
  },
})
</script>
