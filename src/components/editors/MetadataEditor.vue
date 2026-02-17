<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElForm, ElFormItem, ElInput, ElButton, ElCheckboxGroup, ElCheckbox, ElDivider } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { ElMessage } from 'element-plus'
import EditorCard from '@/components/shared/EditorCard.vue'
import AddButton from '@/components/shared/AddButton.vue'
import ContactForm from '@/components/shared/ContactForm.vue'
import OrganizationForm from '@/components/shared/OrganizationForm.vue'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const timestamp = computed({
  get: () => bomStore.bom.metadata.timestamp,
  set: (value: string) => {
    bomStore.bom.metadata.timestamp = value
    bomStore.markModified()
  }
})

const lifecycles = computed({
  get: () => bomStore.bom.metadata.lifecycles || [],
  set: (value: string[]) => {
    bomStore.bom.metadata.lifecycles = value
    bomStore.markModified()
  }
})

const lifecycleOptions = [
  { label: t('metadata.design'), value: 'design' },
  { label: t('metadata.preBuild'), value: 'pre-build' },
  { label: t('metadata.build'), value: 'build' },
  { label: t('metadata.postBuild'), value: 'post-build' },
  { label: t('metadata.operations'), value: 'operations' },
  { label: t('metadata.discovery'), value: 'discovery' },
  { label: t('metadata.decommission'), value: 'decommission' }
]

const refreshTimestamp = () => {
  timestamp.value = new Date().toISOString()
  ElMessage.success(t('common.updated'))
}

const addAuthor = () => {
  if (!bomStore.bom.metadata.authors) {
    bomStore.bom.metadata.authors = []
  }
  bomStore.bom.metadata.authors.push({})
  bomStore.markModified()
}

const updateAuthor = (index: number, author: any) => {
  bomStore.bom.metadata.authors[index] = author
  bomStore.markModified()
}

const removeAuthor = (index: number) => {
  bomStore.bom.metadata.authors.splice(index, 1)
  bomStore.markModified()
}

const updateSupplier = (supplier: any) => {
  bomStore.bom.metadata.supplier = supplier
  bomStore.markModified()
}

const updateManufacturer = (manufacturer: any) => {
  bomStore.bom.metadata.manufacturer = manufacturer
  bomStore.markModified()
}

const updateSubjectComponent = (field: string, value: any) => {
  if (!bomStore.bom.metadata.component) {
    bomStore.bom.metadata.component = {}
  }
  bomStore.bom.metadata.component[field] = value
  bomStore.markModified()
}
</script>

<template>
  <div class="metadata-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('metadata.title')">
        <template #title>
          <TooltipLabel :label="t('metadata.title')" schemaPath="bom.metadata" />
        </template>

        <div class="metadata-editor__content">
        <!-- Timestamp Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.timestamp')" schemaPath="metadata.timestamp" />
          </h3>
          <div class="metadata-editor__timestamp-wrapper">
            <ElInput
              :model-value="timestamp"
              readonly
              class="metadata-editor__input"
            />
            <ElButton
              type="primary"
              plain
              :icon="Refresh"
              size="small"
              @click="refreshTimestamp"
            />
          </div>
        </div>

        <!-- Authors Section -->
        <div class="metadata-editor__section">
          <div class="metadata-editor__section-header">
            <h3 class="metadata-editor__section-title">
              <TooltipLabel :label="t('metadata.authors')" schemaPath="metadata.authors" />
            </h3>
            <AddButton size="small" @click="addAuthor" />
          </div>

          <div v-if="bomStore.bom.metadata.authors && bomStore.bom.metadata.authors.length > 0" class="metadata-editor__items">
            <div
              v-for="(author, index) in bomStore.bom.metadata.authors"
              :key="`author-${index}`"
              class="metadata-editor__item"
            >
              <ContactForm
                :model-value="author"
                removable
                @update:model-value="updateAuthor(Number(index), $event)"
                @remove="removeAuthor(Number(index))"
              />
            </div>
          </div>
          <p v-else class="metadata-editor__empty">{{ t('metadata.noAuthors') }}</p>
        </div>

        <ElDivider />

        <!-- Supplier Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.supplier')" schemaPath="metadata.supplier" />
          </h3>
          <OrganizationForm
            :model-value="bomStore.bom.metadata.supplier || {}"
            :label="t('metadata.supplier')"
            @update:model-value="updateSupplier"
          />
        </div>

        <ElDivider />

        <!-- Subject Component Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.component')" schemaPath="metadata.component" />
          </h3>
          <ElForm label-width="120px" class="metadata-editor__form">
            <ElFormItem>
              <template #label>
                <TooltipLabel :label="t('component.name')" schemaPath="component.name" />
              </template>
              <ElInput
                :model-value="bomStore.bom.metadata.component?.name || ''"
                @update:model-value="updateSubjectComponent('name', $event)"
                class="metadata-editor__input"
              />
            </ElFormItem>
            <ElFormItem>
              <template #label>
                <TooltipLabel :label="t('component.version')" schemaPath="component.version" />
              </template>
              <ElInput
                :model-value="bomStore.bom.metadata.component?.version || ''"
                @update:model-value="updateSubjectComponent('version', $event)"
                class="metadata-editor__input"
              />
            </ElFormItem>
            <ElFormItem>
              <template #label>
                <TooltipLabel :label="t('component.type')" schemaPath="component.type" />
              </template>
              <ElInput
                :model-value="bomStore.bom.metadata.component?.type || ''"
                @update:model-value="updateSubjectComponent('type', $event)"
                class="metadata-editor__input"
              />
            </ElFormItem>
          </ElForm>
        </div>

        <ElDivider />

        <!-- Lifecycles Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.lifecycles')" schemaPath="metadata.lifecycles" />
          </h3>
          <ElCheckboxGroup v-model="lifecycles" class="metadata-editor__checkboxes">
            <ElCheckbox
              v-for="option in lifecycleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElCheckboxGroup>
        </div>

        <ElDivider />

        <!-- Manufacturer Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.manufacturer')" schemaPath="metadata.manufacturer" />
          </h3>
          <OrganizationForm
            :model-value="bomStore.bom.metadata.manufacturer || {}"
            :label="t('metadata.manufacturer')"
            @update:model-value="updateManufacturer"
          />
        </div>

        <ElDivider />

        <!-- Tools Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.tools')" schemaPath="metadata.tools" />
          </h3>
          <p class="metadata-editor__info">{{ t('metadata.toolsInfo') }}</p>
        </div>

        <ElDivider />

        <!-- BOM Licenses Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.licenses')" schemaPath="metadata.licenses" />
          </h3>
          <p class="metadata-editor__info">{{ t('metadata.licensesInfo') }}</p>
        </div>

        <ElDivider />

        <!-- Properties Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.properties')" schemaPath="metadata.properties" />
          </h3>
          <p class="metadata-editor__info">{{ t('metadata.propertiesInfo') }}</p>
        </div>
      </div>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.metadata-editor {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-6;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
  }

  &__section-title {
    font-size: $text-md;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0;
  }

  &__form {
    :deep(.el-form-item__label) {
      color: $text-secondary;
    }
  }

  &__timestamp-wrapper {
    display: flex;
    gap: $space-3;
    align-items: center;
  }

  &__input {
    @include element-input;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__item {
    padding: $space-4;
    background-color: rgba($accent-primary, 0.04);
    border: 1px solid $border-default;
    border-radius: $radius-md;
    transition: all $transition-base;

    &:hover {
      border-color: $border-subtle;
      background-color: rgba($accent-primary, 0.08);
    }
  }

  &__empty {
    font-size: $text-sm;
    color: $text-secondary;
    font-style: italic;
    margin: 0;
    padding: $space-3;
  }

  &__info {
    font-size: $text-sm;
    color: $text-secondary;
    margin: 0;
    padding: $space-3;
    background-color: rgba($accent-primary, 0.04);
    border-left: 2px solid $accent-primary;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &__checkboxes {
    display: flex;
    flex-direction: column;
    gap: $space-3;

    :deep(.el-checkbox) {
      color: $text-primary;
    }
  }

}
</style>
