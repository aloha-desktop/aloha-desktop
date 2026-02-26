<script setup lang="ts">
import { Avatar } from '@renderer/components/ui/avatar'
import { User } from 'lucide-vue-next'
import { Tooltip } from '@renderer/components/ui/tooltip'
</script>

<template>
  <Tooltip content="You">
    <Avatar>
      <User />
    </Avatar>
  </Tooltip>
</template>
