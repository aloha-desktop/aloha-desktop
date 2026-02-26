<template>
  <Card class="w-80">
    <CardHeader>
      <CardTitle class="flex justify-between items-center">
        <div>{{ pluginInfo.name || pluginInfo.directory }}</div>
        <div class="flex items-center gap-2">
          <Tooltip v-if="isEnabled && !isLoaded" content="This plugin failed to load :(">
            <TriangleAlert class="size-5 text-amber-500" />
          </Tooltip>
          <Switch
            v-if="showEnableSwitch"
            :default-value="isEnabled"
            :disabled="!!pluginInfo.error && !isEnabled"
            :model-value="isEnabled"
            @update:model-value="toggleEnabled()"
          />
        </div>
      </CardTitle>
      <CardDescription v-if="pluginInfo.description">
        <div class="flex items-center gap-2 mt-1 mb-2">
          <Badge v-for="tag in pluginInfo.tags" :key="tag" variant="secondary">
            {{ tag }}
          </Badge>
        </div>
        <div>{{ pluginInfo.description }}</div>
      </CardDescription>
    </CardHeader>
    <CardContent class="flex-grow flex flex-col justify-end">
      <div v-if="pluginInfo.error" class="bg-amber-500 text-sm text-white px-3 py-2 rounded-md">
        {{ pluginInfo.error }}
      </div>
      <div v-else class="flex justify-between items-center gap-2">
        <div class="text-sm text-muted-foreground flex">By {{ pluginInfo.author }}</div>
        <div v-if="showVersion" class="text-sm text-muted-foreground flex gap-2 items-center">
          <span>v{{ pluginInfo.version }}</span>
          <Button v-if="showRemove" variant="destructive" size="icon" @click="removePlugin()">
            <Trash2 class="size-4" />
          </Button>
        </div>
        <div v-if="showAdd">
          <Button v-if="!pluginInfo.installed" size="sm" :disabled="installing" @click="addPlugin()">
            <LoaderPinwheel v-if="installing" class="size-4 animate-spin" />
            <Plus v-else class="size-4" />
            <span>Add</span>
          </Button>
          <div v-else>
            <Tooltip content="Installed">
              <Check class="size-4 outline-none" />
            </Tooltip>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Switch } from '@renderer/components/ui/switch'
import { Tooltip } from '@renderer/components/ui/tooltip'
import { Badge } from '@renderer/components/ui/badge'
import { toast } from 'vue-sonner'
import { TriangleAlert, Plus, Check, LoaderPinwheel, Trash2 } from 'lucide-vue-next'
import { Button } from '@renderer/components/ui/button'

export default defineComponent({
  name: 'Plugin',
  components: {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Switch,
    TriangleAlert,
    Tooltip,
    Badge,
    Button,
    Plus,
    Check,
    LoaderPinwheel,
    Trash2,
  },
  props: {
    pluginInfo: {
      type: Object,
      required: true,
    },
    showEnableSwitch: {
      type: Boolean,
      default: false,
    },
    showVersion: {
      type: Boolean,
      default: false,
    },
    showAdd: {
      type: Boolean,
      default: false,
    },
    showRemove: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update'],
  data() {
    return {
      installing: false,
    }
  },
  computed: {
    isEnabled() {
      return typeof this.pluginInfo?.enabled === 'boolean' ? this.pluginInfo.enabled : false
    },
    isLoaded() {
      return typeof this.pluginInfo?.loaded === 'boolean' ? this.pluginInfo.loaded : false
    },
  },
  methods: {
    async toggleEnabled() {
      try {
        if (this.pluginInfo.enabled) {
          await this.$electron.ipcRenderer.invoke('plugins:disable', this.pluginInfo.directory)
        } else {
          await this.$electron.ipcRenderer.invoke('plugins:enable', this.pluginInfo.directory)
        }
      } catch (error) {
        toast('Failed to enable the plugin', {
          description: `${error}`,
        })
      } finally {
        this.$emit('update', this.pluginInfo.directory)
      }
    },
    async addPlugin() {
      try {
        this.installing = true
        await this.$electron.ipcRenderer.invoke('plugins:install', this.pluginInfo.repo)
        toast('Plugin added', {
          description: `${this.pluginInfo.name} has been installed :)`,
        })
      } catch (error) {
        toast('Failed to add the plugin', {
          description: `${error}`,
        })
      } finally {
        this.installing = false
        this.$emit('update', this.pluginInfo.directory)
      }
    },
    async removePlugin() {
      try {
        await this.$electron.ipcRenderer.invoke('plugins:remove', this.pluginInfo.directory)
        toast('Plugin removed', {
          description: `${this.pluginInfo.name} has been removed`,
        })
      } catch (error) {
        toast('Failed to remove the plugin', {
          description: `${error}`,
        })
      } finally {
        this.$emit('update', this.pluginInfo.directory)
      }
    },
  },
})
</script>
