<template>
  <Tooltip content="Tool">
    <Avatar>
      <img v-if="iconSrc" :src="iconSrc" class="size-5 dark:invert" />
      <DraftingCompass v-else class="size-5" />
    </Avatar>
  </Tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Tooltip } from '@renderer/components/ui/tooltip'
import { Avatar } from '@renderer/components/ui/avatar'
import { DraftingCompass } from 'lucide-vue-next'

export default defineComponent({
  components: {
    Tooltip,
    Avatar,
    DraftingCompass,
  },
  props: {
    toolName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      iconSrc: '',
    }
  },
  async mounted() {
    if (this.toolName) {
      this.iconSrc = await this.getToolIcon(this.toolName)
    }
  },
  methods: {
    async getToolIcon(toolName: string): Promise<string> {
      try {
        return await window.electron.ipcRenderer.invoke('plugins:get-tool-icon', toolName)
      } catch (error) {
        console.error('Failed to get tool icon:', error)
        return ''
      }
    },
  },
})
</script>
