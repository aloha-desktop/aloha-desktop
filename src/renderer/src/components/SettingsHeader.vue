<template>
  <PanelHeader class="border-b px-4">
    <SidebarTrigger class="md:hidden" />
    <Separator orientation="vertical" class="mx-2 !h-4 md:hidden" />
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <RouterLink :to="breadcrumbRoot.url ?? '#'"> {{ breadcrumbRoot.title }} </RouterLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage class="text-accent-foreground"> {{ breadcrumbTitle }} </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </PanelHeader>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { SidebarTrigger } from '@renderer/components/ui/sidebar'
import { Separator } from '@renderer/components/ui/separator'
import PanelHeader from '@renderer/components/PanelHeader.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@renderer/components/ui/breadcrumb'

export default defineComponent({
  name: 'SettingsHeader',
  components: {
    SidebarTrigger,
    Separator,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    PanelHeader,
  },
  props: {
    breadcrumbRoot: {
      type: Object as PropType<{
        title: string
        url?: string
      }>,
      required: true,
    },
    breadcrumbTitle: {
      type: String,
      required: true,
    },
  },
})
</script>
