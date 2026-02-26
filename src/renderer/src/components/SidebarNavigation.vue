<template>
  <div class="flex flex-col gap-3">
    <!-- top section -->
    <Tooltip content="Home" side="right">
      <Button :variant="routeActiveVariant('/home')" @click="navigateTo('/home')">
        <Home />
      </Button>
    </Tooltip>
    <Tooltip content="Chats" side="right">
      <Button :variant="routeActiveVariant('/chats')" @click="navigateTo('/chats')">
        <MessagesSquare />
      </Button>
    </Tooltip>
    <Tooltip content="Plugins" side="right">
      <Button :variant="routeActiveVariant('/plugins')" @click="navigateTo('/plugins')">
        <Blocks />
      </Button>
    </Tooltip>
  </div>
  <div class="flex flex-col gap-3">
    <!-- bottom section -->
    <UIModeToggle />
    <Tooltip content="Settings" side="right">
      <Button :variant="routeActiveVariant('/settings')" @click="navigateTo('/settings')">
        <Cog />
      </Button>
    </Tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Button } from '@renderer/components/ui/button'
import { Tooltip } from '@renderer/components/ui/tooltip'
import { Home, MessagesSquare, Blocks, Cog } from 'lucide-vue-next'
import UIModeToggle from '@renderer/components/UIModeToggle.vue'

export default defineComponent({
  name: 'SidebarNavigation',
  components: {
    Button,
    Home,
    MessagesSquare,
    Blocks,
    Cog,
    Tooltip,
    UIModeToggle,
  },
  methods: {
    navigateTo(path: string) {
      this.$router.push(path)
    },
    routeActive(path: string) {
      return this.$route.path.startsWith(path)
    },
    routeActiveVariant(path: string) {
      return this.routeActive(path) ? 'ghostActive' : 'ghost'
    },
  },
})
</script>
