<script setup lang="ts">
import { reactive } from 'vue'

const versions = reactive({ ...window.electron.process.versions })
const contextIsolated = window.contextIsolated
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
    <li class="node-version">Context Isolation {{ contextIsolated ? 'Enabled' : 'Disabled' }}</li>
  </ul>
</template>
