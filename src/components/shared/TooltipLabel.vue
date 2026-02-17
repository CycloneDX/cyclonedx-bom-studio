<script setup lang="ts">
import { computed } from 'vue'
import { ElTooltip, ElIcon } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useSchemaTooltips } from '@/composables/useSchemaTooltips'

const props = defineProps<{
  label: string
  tooltip?: string
  schemaPath?: string
}>()

const bomStore = useBomStore()
const specVersion = computed(() => bomStore.bom.specVersion)
const { tooltip: schemaTooltip } = useSchemaTooltips(specVersion)

const resolvedTooltip = computed(() => {
  // Schema-based tooltip takes precedence if schemaPath is provided
  if (props.schemaPath) {
    return schemaTooltip(props.schemaPath) || props.tooltip
  }
  return props.tooltip
})
</script>

<template>
  <span class="tooltip-label">
    {{ label }}
    <ElTooltip
      v-if="resolvedTooltip"
      :content="resolvedTooltip"
      placement="top"
      :show-after="300"
      :hide-after="0"
      effect="dark"
      :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }"
    >
      <ElIcon class="tooltip-label__icon"><InfoFilled /></ElIcon>
    </ElTooltip>
  </span>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.tooltip-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &__icon {
    font-size: 0.8em;
    color: $text-tertiary;
    cursor: help;
    transition: color $transition-base;
    vertical-align: middle;

    &:hover {
      color: $accent-primary;
    }
  }
}
</style>
