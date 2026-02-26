<script lang="ts">
import { defineComponent } from 'vue'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@renderer/components/ui/resizable'
import { RouterView } from 'vue-router'

export default defineComponent({
  name: 'Chats',
  components: {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
    RouterView,
  },
  data() {
    return {
      leftOpen: true,
    }
  },
  computed: {
    rightOpen() {
      return Object.keys(this.$route.params).includes('uuid')
    },
  },
})
</script>

<template>
  <ResizablePanelGroup id="panel-group" direction="horizontal">
    <ResizablePanel v-show="leftOpen" id="left-panel" :min-size="20" :default-size="30">
      <RouterView name="left" :left-open="leftOpen" :right-open="rightOpen" @update:left-open="leftOpen = $event" />
    </ResizablePanel>
    <ResizableHandle v-if="leftOpen && rightOpen" id="panel-handle" />
    <ResizablePanel v-if="rightOpen" id="right-panel" :min-size="20" :default-size="70">
      <!-- ChatThread nested route -->
      <RouterView
        :key="$route.fullPath"
        name="right"
        :left-open="leftOpen"
        :right-open="rightOpen"
        @update:left-open="leftOpen = $event"
      />
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
