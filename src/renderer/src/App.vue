<script lang="ts">
import { defineComponent } from 'vue'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@renderer/components/ui/resizable'
import PanelHeader from '@renderer/components/PanelHeader.vue'
import SidebarNavigation from '@renderer/components/SidebarNavigation.vue'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { Toaster } from '@renderer/components/ui/sonner'
import 'vue-sonner/style.css' // vue-sonner v2 requires this import

export default defineComponent({
  name: 'App',
  components: {
    ResizablePanel,
    ResizablePanelGroup,
    ResizableHandle,
    PanelHeader,
    SidebarNavigation,
    TooltipProvider,
    Toaster,
  },
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <Toaster />
    <ResizablePanelGroup id="app-panel-group" direction="horizontal" class="border-t">
      <!-- Fixed header area -->
      <ResizablePanel id="app-panel-left" :min-size="0" :max-size="0" class="min-w-13 h-screen flex-col flex">
        <PanelHeader class="justify-center pt-1 px-0">
          <img src="@renderer/assets/logo.png" alt="logo" class="size-7" />
        </PanelHeader>
        <div class="flex flex-col w-full items-center justify-between py-2 flex-grow">
          <SidebarNavigation />
        </div>
      </ResizablePanel>
      <ResizableHandle id="app-panel-handle" disabled />
      <ResizablePanel id="app-panel-right">
        <RouterView />
      </ResizablePanel>
    </ResizablePanelGroup>
  </TooltipProvider>
</template>
