<script lang="ts">
import { defineComponent } from 'vue'
import { Button } from './ui/button'
import { Send, Square } from 'lucide-vue-next'

export default defineComponent({
  name: 'Prompt',
  components: {
    Button,
    Send,
    Square,
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
    abortable: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'submit', 'abort'],
  computed: {
    inputValue: {
      get(): string {
        return this.modelValue
      },
      set(value: string): void {
        this.$emit('update:modelValue', value)
      },
    },
  },
  mounted() {
    if (this.autofocus) {
      this.$nextTick(() => {
        const textarea = this.$refs.textarea as HTMLTextAreaElement | undefined
        if (textarea) {
          textarea.focus()
        }
      })
    }
  },
  methods: {
    onSubmit(): void {
      this.$emit('submit', this.modelValue)
    },
    onAbort(e: Event): void {
      e.preventDefault()
      this.$emit('abort')
    },
  },
})
</script>

<template>
  <form class="flex items-center w-full" @submit.prevent="onSubmit">
    <div class="flex w-full items-stretch justify-stretch relative">
      <textarea
        ref="textarea"
        v-model="inputValue"
        data-slot="input"
        type="text"
        :placeholder="placeholder"
        class="!bg-transparent h-20 pr-16 pb-2 pt-2 pl-2 w-full resize-none outline-none border-none placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 input disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-sm"
        @keydown.meta.enter="onSubmit"
        @keydown.ctrl.enter="onSubmit"
        @keydown.enter.exact.prevent="onSubmit"
      />
      <Button v-if="!abortable" class="absolute right-2 bottom-2 w-13" size="icon" type="submit" :disabled="loading">
        <Send />
      </Button>
      <Button v-else class="absolute right-2 bottom-2 w-13" size="icon" @click="onAbort">
        <Square class="fill-background" stroke-width="0" />
      </Button>
    </div>
  </form>
</template>
