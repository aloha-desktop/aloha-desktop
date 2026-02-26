<template>
  <div class="flex items-center justify-center relative ml-[12px]">
    <div class="dot-falling" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TypingIcon',
  components: {},
})
</script>

<style scoped>
.dot-falling {
  position: relative;
  left: -9999px;
  width: 4px;
  height: 4px;
  border-radius: 2px;
  color: var(--foreground);
  box-shadow: 9999px 0 0 0 var(--foreground);
  animation: dot-falling 1s infinite linear;
  animation-delay: 0.1s;
}
.dot-falling::before,
.dot-falling::after {
  content: '';
  display: inline-block;
  position: absolute;
  top: 0;
  width: 4px;
  height: 4px;
  border-radius: 2px;
}
.dot-falling::before {
  color: var(--foreground);
  animation: dot-falling-before 1s infinite linear;
  animation-delay: 0s;
}
.dot-falling::after {
  color: var(--foreground);
  animation: dot-falling-after 1s infinite linear;
  animation-delay: 0.2s;
}

@keyframes dot-falling {
  0% {
    box-shadow: 9999px -15px 0 0 rgba(0, 0, 0, 0);
  }
  25%,
  50%,
  75% {
    box-shadow: 9999px 0 0 0 var(--foreground);
  }
  100% {
    box-shadow: 9999px 15px 0 0 rgba(0, 0, 0, 0);
  }
}
@keyframes dot-falling-before {
  0% {
    box-shadow: 9991px -15px 0 0 rgba(0, 0, 0, 0);
  }
  25%,
  50%,
  75% {
    box-shadow: 9991px 0 0 0 var(--foreground);
  }
  100% {
    box-shadow: 9991px 15px 0 0 rgba(0, 0, 0, 0);
  }
}
@keyframes dot-falling-after {
  0% {
    box-shadow: 10007px -15px 0 0 rgba(0, 0, 0, 0);
  }
  25%,
  50%,
  75% {
    box-shadow: 10007px 0 0 0 var(--foreground);
  }
  100% {
    box-shadow: 10007px 15px 0 0 rgba(0, 0, 0, 0);
  }
}
</style>
