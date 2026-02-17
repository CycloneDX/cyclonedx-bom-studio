<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import ExternalReferenceEditor from '@/components/shared/ExternalReferenceEditor.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const handleUpdate = (value: any[]) => {
  bomStore.bom.externalReferences = value
  bomStore.markModified()
}
</script>

<template>
  <div class="bom-external-references-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('externalReferences.title')">
        <template #title>
          <TooltipLabel :label="t('externalReferences.title')" schemaPath="bom.externalReferences" />
        </template>

        <div class="bom-external-references-editor__content">
          <p class="bom-external-references-editor__description">
            {{ t('externalReferences.description') }}
          </p>

          <ExternalReferenceEditor
            :model-value="bomStore.bom.externalReferences"
            @update:model-value="handleUpdate"
          />
        </div>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.bom-external-references-editor {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__description {
    font-size: $text-sm;
    color: $text-secondary;
    margin: 0;
    padding: $space-3;
    background-color: rgba($accent-primary, 0.04);
    border-left: 2px solid $accent-primary;
    border-radius: 0 $radius-sm $radius-sm 0;
  }
}
</style>
