<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AvatarRoot } from 'reka-ui'
import { cn } from '@renderer/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <AvatarRoot
    data-slot="avatar"
    :class="
      cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-lg bg-accent text-accent-foreground items-center justify-center',
        props.class
      )
    "
  >
    <slot />
  </AvatarRoot>
</template>
