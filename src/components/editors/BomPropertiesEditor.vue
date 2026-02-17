<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import PropertyEditor from '@/components/shared/PropertyEditor.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const handleUpdate = (value: any[]) => {
  bomStore.bom.properties = value
  bomStore.markModified()
}
</script>

<template>
  <div class="bom-properties-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('properties.title')">
        <template #title>
          <TooltipLabel :label="t('properties.title')" schemaPath="bom.properties" />
        </template>

        <div class="bom-properties-editor__content">
          <PropertyEditor
            :model-value="bomStore.bom.properties"
            @update:model-value="handleUpdate"
          />
        </div>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.bom-properties-editor {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }
}
</style>
