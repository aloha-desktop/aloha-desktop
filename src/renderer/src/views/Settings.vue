<script setup lang="ts">
import SettingsSidebar from '@renderer/components/SettingsSidebar.vue'
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <SettingsSidebar />
    <SidebarInset>
      <RouterView />
    </SidebarInset>
  </SidebarProvider>
</template>
