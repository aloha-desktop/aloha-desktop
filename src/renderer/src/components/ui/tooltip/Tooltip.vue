<script setup lang="ts">
import type { TooltipRootEmits, TooltipRootProps } from 'reka-ui'
import { TooltipRoot, useForwardPropsEmits } from 'reka-ui'
import TooltipContent from './TooltipContent.vue'
import TooltipTrigger from './TooltipTrigger.vue'

const props = defineProps<
  TooltipRootProps & {
    content?: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
>()
const emits = defineEmits<TooltipRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot v-bind="forward">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent :side="side" :align="align">
      {{ content }}
    </TooltipContent>
  </TooltipRoot>
</template>
