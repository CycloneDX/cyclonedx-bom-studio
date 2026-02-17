<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElEmpty } from 'element-plus'
import EditorCard from '@/components/shared/EditorCard.vue'

const { t } = useI18n()
</script>

<template>
  <div class="declaration-editor">
    <EditorCard :title="t('declarations.title')">
      <div class="declaration-editor__content">
        <ElEmpty
          :description="t('declarations.comingSoon')"
          :image-size="200"
        />
      </div>
    </EditorCard>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.declaration-editor {
  width: 100%;

  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
}
</style>
