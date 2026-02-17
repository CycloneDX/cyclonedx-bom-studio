<script setup lang="ts">
import { ElTooltip, ElIcon } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

defineProps<{
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}>()
</script>

<template>
  <ElTooltip
    :content="content"
    :placement="placement || 'top'"
    :show-after="300"
    :hide-after="0"
    effect="dark"
    :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }"
  >
    <ElIcon class="info-tip"><InfoFilled /></ElIcon>
  </ElTooltip>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.info-tip {
  font-size: 0.85em;
  color: $text-tertiary;
  cursor: help;
  transition: color $transition-base;
  vertical-align: middle;
  flex-shrink: 0;

  &:hover {
    color: $accent-primary;
  }
}
</style>
