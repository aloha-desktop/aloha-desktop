<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@renderer/lib/utils'
import { type InputVariants, inputVariants } from '.'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  variant?: InputVariants['variant']
  focus?: InputVariants['focus']
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input v-model="modelValue" data-slot="input" :class="cn(inputVariants({ variant, focus }), props.class)" />
</template>
