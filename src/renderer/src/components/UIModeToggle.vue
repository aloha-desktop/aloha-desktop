<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import RadixIcon from '@renderer/components/ui/RadixIcon.vue'

// Pass { disableTransition: false } to enable transitions
const mode = useColorMode({
  initialValue: 'system',
})
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost">
        <RadixIcon
          icon="moon"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0"
        />
        <RadixIcon
          icon="sun"
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="mode = 'light'">
        <span class="text-sm">Light</span>
        <RadixIcon v-if="mode === 'light'" icon="check" class="h-[1.2rem] w-[1.2rem]" />
      </DropdownMenuItem>
      <DropdownMenuItem @click="mode = 'dark'">
        <span class="text-sm">Dark</span>
        <RadixIcon v-if="mode === 'dark'" icon="check" class="h-[1.2rem] w-[1.2rem]" />
      </DropdownMenuItem>
      <DropdownMenuItem @click="mode = 'system'">
        <span class="text-sm">System</span>
        <RadixIcon v-if="mode === 'system'" icon="check" class="h-[1.2rem] w-[1.2rem]" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
