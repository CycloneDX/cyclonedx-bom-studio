<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElButton, ElIcon, ElSelect, ElOption, ElMessage } from 'element-plus'
import { CopyDocument, Refresh } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import { SUPPORTED_SPEC_VERSIONS } from '@/composables/useSchemaTooltips'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const serialNumber = computed({
  get: () => bomStore.bom.serialNumber,
  set: (value: string) => {
    bomStore.bom.serialNumber = value
    bomStore.markModified()
  }
})

const version = computed({
  get: () => bomStore.bom.version,
  set: (value: number) => {
    bomStore.bom.version = Math.max(1, value)
    bomStore.markModified()
  }
})

const specVersion = computed({
  get: () => bomStore.bom.specVersion,
  set: (value: string) => {
    bomStore.bom.specVersion = value
    bomStore.markModified()
  }
})

// Only show 1.6+ versions in the dropdown
const specVersionOptions = SUPPORTED_SPEC_VERSIONS.filter(v => parseFloat(v) >= 1.6)

const bomFormat = computed(() => bomStore.bom.bomFormat)

const copySerialNumber = () => {
  navigator.clipboard.writeText(serialNumber.value).then(() => {
    ElMessage.success(t('common.copied'))
  })
}

const regenerateSerialNumber = () => {
  bomStore.regenerateSerialNumber()
  ElMessage.success(t('bomIdentity.regenerateSerialNumber'))
}
</script>

<template>
  <div class="bom-identity-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('bomIdentity.title')">
        <template #title>
          <TooltipLabel :label="t('bomIdentity.title')" schemaPath="bom.serialNumber" />
        </template>

        <ElForm label-width="180px" class="bom-identity-editor__form">
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('bomIdentity.serialNumber')" schemaPath="bom.serialNumber" />
            </template>
            <div class="bom-identity-editor__serial-wrapper">
              <ElInput
                v-model="serialNumber"
                readonly
                class="bom-identity-editor__serial-input"
              />
              <ElButton
                type="primary"
                plain
                :icon="CopyDocument"
                size="small"
                @click="copySerialNumber"
              />
              <ElButton
                type="primary"
                plain
                :icon="Refresh"
                size="small"
                @click="regenerateSerialNumber"
              />
            </div>
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('bomIdentity.version')" schemaPath="bom.version" />
            </template>
            <ElInputNumber
              v-model="version"
              :min="1"
              class="bom-identity-editor__input-number"
            />
            <p class="bom-identity-editor__hint">{{ t('bomIdentity.versionHint') }}</p>
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('bomIdentity.bomFormat')" schemaPath="bom.bomFormat" />
            </template>
            <ElInput
              :model-value="bomFormat"
              readonly
              class="bom-identity-editor__readonly-input"
            />
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('bomIdentity.specVersion')" schemaPath="bom.specVersion" />
            </template>
            <ElSelect
              v-model="specVersion"
              class="bom-identity-editor__spec-select"
            >
              <ElOption
                v-for="sv in specVersionOptions"
                :key="sv"
                :label="sv"
                :value="sv"
              />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.bom-identity-editor {
  width: 100%;

  &__form {
    :deep(.el-form-item__label) {
      color: $text-secondary;
      font-weight: $weight-medium;
      white-space: nowrap;
    }
  }

  &__serial-wrapper {
    display: flex;
    gap: $space-3;
    align-items: center;
    min-width: 480px;
  }

  &__serial-input {
    flex: 1;
    min-width: 380px;
    @include element-input;

    :deep(.el-input__inner) {
      font-family: $font-mono;
    }
  }

  &__spec-select {
    width: 200px;
    @include element-select;
  }

  &__input-number {
    width: 200px;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
    }
  }

  &__hint {
    font-size: $text-sm;
    color: $text-secondary;
    margin: $space-2 0 0 0;
    font-style: italic;
  }

  &__readonly-input {
    width: 200px;
    @include element-input;
  }

}
</style>
