<script lang="ts">
import { defineComponent } from 'vue'
import { Button } from '@renderer/components/ui/button'

export default defineComponent({
  components: {
    Button,
  },
  methods: {
    async handleList() {
      try {
        const { models } = await this.$electron.ipcRenderer.invoke('llm:list-models')
        console.log('models', models)
      } catch (error) {
        console.error('Error listing models', error)
      }
    },
  },
})
</script>

<template>
  <div class="w-full flex justify-center mt-5 gap-2 items-center">
    <Button @click="handleList">List Models</Button>
  </div>
</template>
