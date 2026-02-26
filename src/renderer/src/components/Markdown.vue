<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="overflow-x-hidden py-2 flex-1 markdown-it [&_h2>*]:inline-block [&_h2]:mt-5 [&_h2]:font-bold [&_h2]:text-muted-foreground [&_h2]:mb-2 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2"
    v-html="html"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async'
import MarkdownItAsync from 'markdown-it-async'
import { codeToHtml } from 'shiki' // Or your custom shorthand bundle
import { addHeaderWithCopy } from 'shiki-header-with-copy'
import { imgSize } from '@mdit/plugin-img-size'

// Initialize MarkdownIt instance with markdown-it-async
const md = MarkdownItAsync({
  warnOnSyncRender: true,
})
md.use(imgSize)

md.use(
  fromAsyncCodeToHtml(
    // Pass the codeToHtml function
    codeToHtml,
    {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        addHeaderWithCopy({
          headerClass: 'flex justify-between items-center px-4 pt-3 text-muted-foreground',
          preClass: 'overflow-x-hidden rounded-lg my-2',
          codeWrapperClass: 'px-4 py-4 overflow-x-auto',
          showButtonText: true,
          copyButtonClass:
            'hover:text-accent-foreground text-xs px-2 group **:data-svg:h-[15px] *:flex *:items-center *:gap-2',
          copyReadyIconClass: '',
          copySuccessIconClass: '**:data-svg:text-green-500',
          langClass: 'text-xs',
        }),
      ],
    }
  )
)

export default defineComponent({
  inject: ['asyncComponentLoading', 'asyncComponentResolved'],
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      html: 'Loading...',
    }
  },
  watch: {
    content: 'renderContent',
  },
  created() {
    this.asyncComponentLoading(this)
  },
  async mounted() {
    await this.renderContent()
    this.asyncComponentResolved(this)
  },
  methods: {
    async renderContent() {
      this.html = await md.renderAsync(this.content)
    },
  },
})
</script>
