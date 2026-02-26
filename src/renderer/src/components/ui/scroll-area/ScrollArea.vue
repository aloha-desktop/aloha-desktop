<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useScroll } from '@vueuse/core'
import { nextTick, defineExpose, useTemplateRef, onMounted, toRefs, watch } from 'vue'
import { ScrollAreaCorner, ScrollAreaRoot, type ScrollAreaRootProps, ScrollAreaViewport } from 'reka-ui'
import { cn } from '@renderer/lib/utils'
import ScrollBar from './ScrollBar.vue'

export type ScrollBehavior = 'auto' | 'instant' | 'smooth'

const props = defineProps<ScrollAreaRootProps & { class?: HTMLAttributes['class']; watchScroll?: boolean }>()

const delegatedProps = reactiveOmit(props, 'class')

const scrollAreaViewport = useTemplateRef<InstanceType<typeof ScrollAreaViewport>>('scrollAreaViewport')

/**
 * Scroll to the bottom of the scroll area, waits for the next tick internally for the viewport to be updated.
 * @param behavior - The scroll behavior 'auto' | 'instant' | 'smooth'. Defaults to 'instant'.
 */
function scrollToBottom(behavior: ScrollBehavior = 'instant'): void {
  nextTick(() => {
    const viewportElement = scrollAreaViewport.value?.viewportElement
    if (viewportElement) {
      viewportElement.scrollTo({
        top: viewportElement.scrollHeight - viewportElement.clientHeight,
        behavior,
      })
    }
  })
}

async function getViewportHeight(): Promise<number | null> {
  await nextTick()
  const viewportElement = scrollAreaViewport.value?.viewportElement
  return viewportElement?.clientHeight || null
}

defineExpose({ scrollToBottom, getViewportHeight })

const emits = defineEmits<{ (e: 'arrived-bottom-change', value: boolean): void }>()

onMounted(() => {
  const vp = scrollAreaViewport.value?.viewportElement

  if (props.watchScroll && vp) {
    const { arrivedState } = useScroll(vp, {
      observe: {
        mutation: true,
      },
    })
    const { bottom: arrivedBottom } = toRefs(arrivedState)

    watch(arrivedBottom, (newValue) => {
      emits('arrived-bottom-change', newValue)
    })
  }
})
</script>

<template>
  <ScrollAreaRoot data-slot="scroll-area" v-bind="delegatedProps" :class="cn('relative', props.class)">
    <ScrollAreaViewport
      ref="scrollAreaViewport"
      as-child
      data-slot="scroll-area-viewport"
      class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
