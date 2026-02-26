<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { icons } from '@iconify-json/radix-icons'
import { defineProps, useAttrs } from 'vue'

const props = defineProps<{
  icon: string
}>()
const attrs = useAttrs()
</script>

<template>
  <Icon :icon="icons.icons[props.icon]" v-bind="attrs" />
</template>
