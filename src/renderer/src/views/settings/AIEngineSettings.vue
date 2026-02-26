<script lang="ts">
import { defineComponent } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import SettingsHeader from '@renderer/components/SettingsHeader.vue'
import { Separator } from '@renderer/components/ui/separator'
import { ScrollArea } from '@renderer/components/ui/scroll-area'

export default defineComponent({
  name: 'AIEngineSettings',
  components: {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Skeleton,
    SettingsHeader,
    Separator,
    ScrollArea,
  },
  data() {
    return {
      isEngineRunning: null as boolean | null,
      engineVersion: '',
      downloadedVersions: [] as string[],
      isEngineBuiltin: null as boolean | null,
      loadingEngineStatus: false,
      loadingEngineVersion: false,
      loadingDownloadedVersions: false,
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadEngineStatus(): Promise<void> {
      this.loadingEngineStatus = true
      try {
        this.isEngineRunning = await this.$electron.ipcRenderer.invoke('llm:is-running')
      } catch (error) {
        console.error('Failed to check engine running status:', error)
        this.isEngineRunning = false
      } finally {
        this.loadingEngineStatus = false
      }
    },
    async loadDownloadedVersions(): Promise<void> {
      this.loadingDownloadedVersions = true
      try {
        this.downloadedVersions = await this.$electron.ipcRenderer.invoke('llm:list-downloaded')
      } catch (error) {
        console.error('Failed to load downloaded versions:', error)
        this.downloadedVersions = []
      } finally {
        this.loadingDownloadedVersions = false
      }
    },
    async loadEngineVersion(): Promise<void> {
      this.loadingEngineVersion = true
      try {
        // Get engine version if running
        if (this.isEngineRunning) {
          try {
            this.engineVersion = await this.$electron.ipcRenderer.invoke('llm:engine-version')
          } catch (error) {
            console.error('Failed to get engine version:', error)
            this.engineVersion = ''
          }
        }

        // Check if using built-in engine
        try {
          this.isEngineBuiltin = await this.$electron.ipcRenderer.invoke('llm:is-engine-builtin')
        } catch (error) {
          console.error('Failed to check if engine is built-in:', error)
          this.isEngineBuiltin = null
        }
      } catch (error) {
        console.error('Failed to load engine info:', error)
      } finally {
        this.loadingEngineVersion = false
      }
    },
    async loadData(): Promise<void> {
      await this.loadEngineStatus()
      await this.loadEngineVersion()
      await this.loadDownloadedVersions()
    },
  },
})
</script>

<template>
  <div id="ai-engine-settings" class="flex flex-col h-screen w-full">
    <SettingsHeader :breadcrumb-root="{ title: 'AI', url: '/settings' }" breadcrumb-title="Engine" />

    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="flex flex-1 flex-col gap-4 p-4">
        <!-- AI Engine Running Status Section -->
        <Card class="gap-3">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span>Ollama AI Engine</span>
              <div v-if="loadingEngineStatus" class="flex items-center gap-2">
                <Skeleton class="h-4 w-32" />
              </div>
              <Badge v-else :variant="isEngineRunning ? 'default' : 'secondary'" class="capitalize">
                {{ isEngineRunning ? 'Running' : 'Stopped' }}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent v-if="isEngineRunning && !loadingEngineVersion">
            <div class="flex items-center gap-1 text-muted-foreground text-sm font-medium">
              <span>Version</span>
              <span v-if="engineVersion" class="select-text">{{ engineVersion }}</span>
              <span v-else> Unknown </span>
            </div>
          </CardContent>
        </Card>

        <!-- Built-in Ollama Engine Section -->
        <Card class="gap-3">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span>Using Built-in Ollama Engine</span>
              <div v-if="loadingEngineVersion" class="flex items-center gap-2">
                <Skeleton class="h-4 w-32" />
              </div>
              <div v-else-if="isEngineBuiltin !== null" class="flex items-center gap-2">
                <Badge :variant="isEngineBuiltin ? 'default' : 'secondary'" class="capitalize">
                  {{ isEngineBuiltin ? 'Yes' : 'No' }}
                </Badge>
              </div>
              <div v-else class="text-sm text-muted-foreground">
                <Badge variant="secondary">Status unknown</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <div class="text-sm text-muted-foreground">
              The built-in Ollama engine provides a self-contained AI inference environment that doesn't require a
              separate Ollama installation on your system.
            </div>
            <Separator class="my-2" />
            <div>
              <h3 class="font-semibold leading-none text-sm">Downloaded versions</h3>
              <ul class="ml-6 list-disc [&>li]:mt-2 select-text text-muted-foreground text-sm">
                <li v-for="version in downloadedVersions" :key="version">
                  {{ version }}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>
