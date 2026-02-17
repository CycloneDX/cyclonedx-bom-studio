<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElButton } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

interface Props {
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
  label?: string
}

withDefaults(defineProps<Props>(), {
  size: 'default',
  disabled: false,
  label: undefined
})

defineEmits<{
  click: []
}>()

const { t } = useI18n()
</script>

<template>
  <ElButton
    type="primary"
    plain
    :icon="Plus"
    :size="size"
    :disabled="disabled"
    @click="$emit('click')"
  >
    {{ label || t('common.add') }}
  </ElButton>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

:deep(.el-button--primary) {
  --el-button-bg-color: rgba($accent-primary, 0.1);
  --el-button-border-color: rgba($accent-primary, 0.3);
  --el-button-text-color: $accent-primary;

  &:hover {
    --el-button-bg-color: rgba($accent-primary, 0.2);
    --el-button-border-color: $accent-primary;
  }
}
</style>
