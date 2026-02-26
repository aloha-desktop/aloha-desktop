<template>
  <div id="plugins" class="flex flex-col h-screen w-full bg-sidebar dark:bg-background">
    <!-- Fixed header area -->
    <PanelHeader class="border-b bg-background flex justify-between items-center">
      <h2 class="text-lg font-semibold">Plugins</h2>
      <div class="flex items-center gap-2">
        <Toggle :model-value="deleteMode" class="p-3" @update:model-value="onDeleteModeUpdate">
          <Trash2 class="size-4" />
        </Toggle>
        <Tooltip content="Open plugins folder">
          <Button variant="ghost" @click="openPluginsFolder">
            <Folder class="size-4" />
          </Button>
        </Tooltip>
      </div>
    </PanelHeader>
    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="flex w-full py-2 px-4">
        <div v-if="loading" class="flex space-x-4">
          <div v-for="i in 3" :key="i" class="flex flex-col space-y-3">
            <Skeleton class="h-[125px] w-[250px] rounded-xl" />
            <div class="space-y-2">
              <Skeleton class="h-4 w-[250px]" />
              <Skeleton class="h-4 w-[200px]" />
            </div>
          </div>
        </div>
        <Tabs v-else v-model="activeTab" class="w-full">
          <div class="flex justify-center gap-4 mt-2 mb-2">
            <div class="relative w-full items-center bg-gray-200 dark:bg-black rounded-md">
              <Input
                ref="searchInput"
                v-model="search"
                type="text"
                focus="no-ring"
                placeholder="Search plugins..."
                class="pl-8 border-none bg-transparent shadow-none"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Search class="size-5 text-muted-foreground" />
              </span>
              <span class="absolute end-0 inset-y-0 flex items-center justify-center px-2">
                <Button v-show="search" variant="ghost" class="size-6 border-none" @click="clearSearch">
                  <X class="size-4 text-muted-foreground" />
                </Button>
              </span>
            </div>
            <TabsList
              class="w-100 bg-gray-200 dark:bg-black grid grid-cols-2 items-center justify-center rounded-md [&>[data-state=active]]:dark:bg-muted [&>[data-state=active]]:text-accent-foreground"
            >
              <TabsTrigger value="installed">Installed</TabsTrigger>
              <TabsTrigger value="available">Marketplace</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="installed">
            <AppError
              v-if="availablePluginsError"
              :error="availablePluginsError"
              title="There was an error loading the plugins..."
            />
            <div v-else class="flex flex-wrap gap-4">
              <Plugin
                v-for="plugin in filteredAvailablePlugins"
                :key="plugin.name"
                :plugin-info="plugin"
                show-enable-switch
                show-version
                :show-remove="deleteMode"
                @update="onUpdate"
              />
            </div>
            <div
              v-if="!availablePluginsError && filteredAvailablePlugins.length === 0"
              class="flex justify-center items-center gap-2 p-4"
            >
              <SearchX class="size-5 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">No plugins found matching your search criteria :(</p>
            </div>
            <div class="flex justify-center items-center p-4 my-4">
              <Button variant="ghost" class="text-muted-foreground" @click="activeTab = 'available'">
                <Store class="size-4" />
                Find more on plugin marketplace
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="available">
            <AppError
              v-if="remotePluginsError"
              :error="remotePluginsError"
              title="There was an error loading the plugins..."
            />
            <div v-else class="flex flex-wrap gap-4">
              <Plugin
                v-for="plugin in filteredRemotePlugins"
                :key="plugin.name"
                :plugin-info="plugin"
                show-add
                @update="onUpdate"
              />
            </div>
            <div
              v-if="!remotePluginsError && filteredRemotePlugins.length === 0"
              class="flex justify-center items-center gap-2 p-4"
            >
              <SearchX class="size-5 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">No plugins found matching your search criteria :(</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  </div>
</template>

<script lang="ts">
import { ComponentPublicInstance, defineComponent } from 'vue'
import { Skeleton } from '@renderer/components/ui/skeleton'
import AppError from '@renderer/components/AppError.vue'
import Plugin from '@renderer/components/Plugin.vue'
import PanelHeader from '@renderer/components/PanelHeader.vue'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Tooltip } from '@renderer/components/ui/tooltip'
import { Search, X, SearchX, Trash2, Store, Folder } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Toggle } from '@renderer/components/ui/toggle'
import { toast } from 'vue-sonner'

type RemotePluginType = {
  repo: string
  name: string
  author: string
  description: string
  icon: string
}

type LocalPluginType = {
  directory: string
  name?: string
  description?: string
  enabled: boolean
  loaded: boolean
  installed: boolean
}

export default defineComponent({
  name: 'Plugins',
  components: {
    Skeleton,
    AppError,
    Plugin,
    PanelHeader,
    ScrollArea,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Input,
    Store,
    Search,
    X,
    Button,
    SearchX,
    Toggle,
    Trash2,
    Tooltip,
    Folder,
  },
  data() {
    return {
      loading: true,
      availablePluginsError: '',
      remotePluginsError: '',
      activeTab: 'installed',
      availablePlugins: [] as LocalPluginType[],
      remotePlugins: [] as RemotePluginType[],
      search: '',
      deleteMode: false,
    }
  },
  computed: {
    filteredAvailablePlugins() {
      const search = this.search.toLowerCase()
      return this.availablePlugins.filter(
        (plugin) =>
          plugin.name?.toLowerCase().includes(search) ||
          plugin.directory?.toLowerCase().includes(search) ||
          plugin.description?.toLowerCase().includes(search)
      )
    },
    filteredRemotePlugins() {
      const search = this.search.toLowerCase()
      return this.remotePlugins
        .filter(
          (plugin) =>
            plugin.name?.toLowerCase().includes(search) ||
            plugin.description?.toLowerCase().includes(search) ||
            plugin.author?.toLowerCase().includes(search) ||
            plugin.repo?.toLowerCase().includes(search)
        )
        .map((plugin) => this.formatRemotePlugin(plugin))
    },
    installedPlugins() {
      return new Set(this.availablePlugins.filter((p) => p.installed).map((p) => p.directory))
    },
  },
  async mounted() {
    try {
      this.loading = true
      await this.getAvailablePlugins() // to get installed flag first before loading remote plugins
      await this.getRemotePlugins()
    } finally {
      this.loading = false
    }
  },
  methods: {
    async onUpdate() {
      this.deleteMode = false
      this.getAvailablePlugins()
    },
    clearSearch() {
      this.search = ''
      const searchInput = this.$refs.searchInput as ComponentPublicInstance | undefined
      searchInput?.$el?.focus()
    },
    onDeleteModeUpdate() {
      this.deleteMode = !this.deleteMode
      if (this.deleteMode) {
        this.activeTab = 'installed'
        toast('Delete mode enabled', {
          description: 'Select plugin to remove.',
        })
      }
    },
    async getAvailablePlugins() {
      try {
        const availablePlugins = await this.$electron.ipcRenderer.invoke('plugins:available-plugins')
        this.availablePlugins = await Promise.all(availablePlugins.map(this.getPluginInfo))
      } catch (error) {
        this.availablePluginsError = `${error}`
      }
    },
    async getPluginInfo(directory: string) {
      try {
        return await this.$electron.ipcRenderer.invoke('plugins:get-plugin-info', directory)
      } catch (error) {
        return {
          directory,
          error: `${error}`,
        }
      }
    },
    async getRemotePlugins() {
      try {
        this.remotePlugins = await this.$electron.ipcRenderer.invoke('plugins:remote-plugins')
      } catch (error) {
        this.remotePluginsError = `${error}`
      }
    },
    formatRemotePlugin(plugin: RemotePluginType) {
      const directory = plugin.repo.split('/')[1]
      const installed = this.installedPlugins.has(directory)

      return {
        ...plugin,
        directory,
        installed,
      }
    },
    async openPluginsFolder() {
      try {
        await this.$electron.ipcRenderer.invoke('plugins:open-folder')
      } catch (error) {
        toast.error('Failed to open plugins folder', {
          description: `${error}`,
        })
      }
    },
  },
})
</script>
