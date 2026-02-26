<template>
  <Collapsible v-model:open="isOpen" class="flex flex-col my-2">
    <CollapsibleTrigger as-child>
      <Button variant="ghost" class="flex flex-row items-center justify-between gap-2 w-full pl-0 rounded-lg group">
        <div class="flex items-center gap-2">
          <slot name="icon"></slot>
          <strong>{{ title }}</strong>
        </div>
        <div
          class="flex items-center justify-center transition-all duration-200 ease-in-out opacity-0 group-hover:opacity-100 text-muted-foreground"
        >
          <ChevronsDownUp v-if="isOpen" class="size-4" />
          <ChevronsUpDown v-else class="size-4" />
        </div>
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Markdown :content="content" class="ml-10" :class="contentClass" />
      <div class="flex justify-end ml-10 gap-2 text-xs">
        <Button variant="link" size="xs" class="text-muted-foreground" @click="isOpen = false">
          <span>Close</span>
        </Button>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Markdown from '@renderer/components/Markdown.vue'
import { Button } from '@renderer/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@renderer/components/ui/collapsible'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next'

export default defineComponent({
  components: {
    Markdown,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    Button,
    ChevronsDownUp,
    ChevronsUpDown,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentClass: {
      type: String,
      default: '',
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: this.open,
    }
  },
})
</script>
