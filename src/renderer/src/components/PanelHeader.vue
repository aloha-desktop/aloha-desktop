<template>
  <div :class="cn('h-13 w-full flex items-center px-4 sticky top-0 z-10 gap-2', props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@renderer/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
