<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import type { ModelResponse } from 'ollama'
import type { ModelDetails } from '@common/types/model-capability'

const SUPPORTED_CAPABILITIES = ['thinking', 'tools']

export default defineComponent({
  name: 'AIModelItem',
  components: {
    Button,
    Badge,
  },
  props: {
    model: {
      type: Object as PropType<ModelResponse>,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['set-default'],
  data() {
    return {
      details: null as ModelDetails | null,
    }
  },
  computed: {
    supportedCapabilities(): string[] {
      return this.details?.capabilities.filter((capability) => SUPPORTED_CAPABILITIES.includes(capability)) || []
    },
  },
  async mounted() {
    await this.fetchModelDetails()
  },
  methods: {
    async fetchModelDetails() {
      try {
        this.details = await this.$electron.ipcRenderer.invoke('llm:get-model-details', this.model.name)
      } catch (error) {
        console.error('Failed to fetch model details:', error)
        this.details = null
      }
    },
    formatBytes(bytes: number): string {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    setAsDefault() {
      this.$emit('set-default', this.model.name)
    },
  },
})
</script>

<template>
  <div class="group flex items-center justify-between p-3 hover:bg-accent/50 rounded-md transition-colors">
    <div class="flex flex-col gap-1">
      <div class="font-medium flex items-center gap-2 flex-wrap">
        <span>{{ model.name }}</span>
        <Badge v-for="capability in supportedCapabilities" :key="capability" variant="outline" size="sm">
          {{ capability }}
        </Badge>
      </div>
      <span class="text-sm text-muted-foreground">
        {{ formatBytes(model.size) }}<span v-if="details?.parameterSize"></span>
      </span>
    </div>
    <div v-if="!isCurrent" class="opacity-0 group-hover:opacity-100 transition-opacity">
      <Button size="sm" :disabled="loading" @click="setAsDefault"> Set as Current </Button>
    </div>
    <div v-else>
      <Badge variant="default" size="sm">Current</Badge>
    </div>
  </div>
</template>
