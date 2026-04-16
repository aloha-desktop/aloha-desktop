<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  type SidebarProps,
  SidebarRail,
} from '@renderer/components/ui/sidebar'
import PanelHeader from './PanelHeader.vue'

const props = defineProps<SidebarProps>()

// This is sample data.
const data = {
  navMain: [
    {
      title: 'AI',
      url: '/settings',
      items: [
        {
          title: 'Model',
          url: '/settings/ai-model',
        },
        {
          title: 'Engine',
          url: '/settings/ai-engine',
        },
        {
          title: 'Models Marketplace',
          url: '/settings/ai-model-pull',
        },
      ],
    },
    {
      title: 'Communication',
      url: '/settings/gateway',
      items: [
        {
          title: 'Gateway',
          url: '/settings/gateway',
        },
      ],
    },
    {
      title: 'General',
      url: '/settings/about',
      items: [
        {
          title: 'About',
          url: '/settings/about',
        },
      ],
    },
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <PanelHeader class="border-b">
      <h2 class="text-lg font-semibold">Settings</h2>
    </PanelHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in data.navMain" :key="item.title">
            <SidebarMenuButton as-child>
              <RouterLink :to="item.url" class="font-medium">
                {{ item.title }}
              </RouterLink>
            </SidebarMenuButton>
            <SidebarMenuSub v-if="item.items.length">
              <SidebarMenuSubItem v-for="childItem in item.items" :key="childItem.title">
                <SidebarMenuSubButton as-child :is-active="childItem.url === $route.path">
                  <RouterLink :to="childItem.url">{{ childItem.title }}</RouterLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
