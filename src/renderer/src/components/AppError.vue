<template>
  <div class="text-sm text-muted-foreground text-left break-words">
    <h2 v-if="title" class="text-lg font-bold">{{ title }}</h2>
    <pre class="whitespace-pre-wrap break-words">{{ error }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: {
      type: String,
      required: false,
      default: '',
    },
    error: {
      type: String,
      required: true,
    },
  },
})
</script>
