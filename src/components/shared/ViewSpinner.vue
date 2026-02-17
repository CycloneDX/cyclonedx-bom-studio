<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const { t } = useI18n()
</script>

<template>
  <div class="view-spinner">
    <div class="view-spinner__inner">
      <el-icon class="view-spinner__icon" :size="32">
        <Loading />
      </el-icon>
      <span class="view-spinner__text">{{ t('common.loading') }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.view-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 200px;
  flex: 1;

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
  }

  &__icon {
    color: $accent-primary;
    animation: spin 1s linear infinite;
  }

  &__text {
    font-size: $text-sm;
    color: $text-tertiary;
    letter-spacing: 0.02em;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
