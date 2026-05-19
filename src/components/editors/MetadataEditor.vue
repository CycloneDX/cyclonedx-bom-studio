<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElForm, ElFormItem, ElInput, ElButton, ElCheckboxGroup, ElCheckbox, ElDivider, ElSelect, ElOption } from 'element-plus'
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
import { useSpecVersionGating, TLP_CLASSIFICATIONS } from '@/composables/useSpecVersionGating'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()
const { supportsDistributionConstraints } = useSpecVersionGating()

// Translation lookup for the five TLP enum values. The CycloneDX schema
// uses uppercase identifiers (CLEAR, GREEN, AMBER, AMBER_AND_STRICT,
// RED); the i18n strings render the human-friendly label and a short
// description sourced from the `meta:enum` block in bom-1.7.schema.json.
const tlpOptions = TLP_CLASSIFICATIONS.map(value => ({
  value,
  label: t(`metadata.tlp.${value}`),
}))

/**
 * Two-way binding for `metadata.distributionConstraints.tlp`.
 *
 * - get: returns the current value or '' when unset, so ElSelect can
 *   render a clean placeholder instead of "undefined".
 * - set: writes through `markModified` and prunes the wrapper object
 *   when the user clears the selection so the saved JSON does not
 *   carry an empty `distributionConstraints: {}` payload.
 */
const tlp = computed({
  get: () => (bomStore.bom.metadata?.distributionConstraints?.tlp as string | undefined) ?? '',
  set: (value: string) => {
    if (!bomStore.bom.metadata) bomStore.bom.metadata = {}
    if (!value) {
      // Clear selection: remove the field entirely so JCS canonical
      // bytes do not change when the user toggles the dropdown back
      // to its initial unset state.
      if (bomStore.bom.metadata.distributionConstraints) {
        delete bomStore.bom.metadata.distributionConstraints.tlp
        if (Object.keys(bomStore.bom.metadata.distributionConstraints).length === 0) {
          delete bomStore.bom.metadata.distributionConstraints
        }
      }
    } else {
      if (!bomStore.bom.metadata.distributionConstraints) {
        bomStore.bom.metadata.distributionConstraints = {}
      }
      bomStore.bom.metadata.distributionConstraints.tlp = value
    }
    bomStore.markModified()
  },
})

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

const toolEntries = computed(() => {
  const tools = bomStore.bom.metadata?.tools
  if (!tools) return []

  const entries: string[] = []
  if (Array.isArray(tools.components)) {
    for (const component of tools.components) {
      const name = typeof component?.name === 'string' ? component.name.trim() : ''
      const version = typeof component?.version === 'string' ? component.version.trim() : ''
      const type = typeof component?.type === 'string' ? component.type.trim() : ''
      const normalizedName = name.toLowerCase()
      const normalizedVersion = version.toLowerCase()
      const nameAlreadyContainsVersion = !!(
        version &&
        (normalizedName.includes(normalizedVersion) || normalizedName.includes(`v${normalizedVersion}`))
      )
      const details = [name, version && !nameAlreadyContainsVersion ? `v${version}` : '', type ? `(${type})` : ''].filter(Boolean).join(' ')
      if (details) entries.push(details)
    }
  }

  if (Array.isArray(tools.services)) {
    for (const service of tools.services) {
      const name = typeof service?.name === 'string' ? service.name.trim() : ''
      const version = typeof service?.version === 'string' ? service.version.trim() : ''
      const details = [`service: ${name || 'Unnamed service'}`, version ? `v${version}` : ''].filter(Boolean).join(' ')
      entries.push(details)
    }
  }

  return entries
})

const bomLicenseEntries = computed(() => {
  const licenses = bomStore.bom.metadata?.licenses
  if (!Array.isArray(licenses)) return []

  const entries: string[] = []
  for (const entry of licenses) {
    if (typeof entry?.expression === 'string' && entry.expression.trim()) {
      entries.push(entry.expression.trim())
      continue
    }

    const license = entry?.license
    if (!license || typeof license !== 'object') continue

    const id = typeof license.id === 'string' ? license.id.trim() : ''
    const name = typeof license.name === 'string' ? license.name.trim() : ''
    const url = typeof license.url === 'string' ? license.url.trim() : ''
    const details = [id || name, url ? `(${url})` : ''].filter(Boolean).join(' ')
    if (details) entries.push(details)
  }

  return entries
})

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

        <!-- Distribution Constraints (TLP) Section. CycloneDX 1.7+. -->
        <div v-if="supportsDistributionConstraints" class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.distributionConstraints')" schemaPath="metadata.distributionConstraints" />
          </h3>
          <ElForm label-width="120px" class="metadata-editor__form">
            <ElFormItem>
              <template #label>
                <TooltipLabel :label="t('metadata.tlp.label')" schemaPath="metadata.distributionConstraints.tlp" />
              </template>
              <ElSelect
                v-model="tlp"
                clearable
                :placeholder="t('metadata.tlp.placeholder')"
                class="metadata-editor__input"
              >
                <ElOption
                  v-for="opt in tlpOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElForm>
        </div>

        <ElDivider v-if="supportsDistributionConstraints" />

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
          <div v-if="toolEntries.length > 0" class="metadata-editor__items">
            <div
              v-for="(tool, index) in toolEntries"
              :key="`tool-${index}`"
              class="metadata-editor__item"
            >
              <p class="metadata-editor__summary">{{ tool }}</p>
            </div>
          </div>
          <p v-else class="metadata-editor__empty">No tools added yet.</p>
        </div>

        <ElDivider />

        <!-- BOM Licenses Section -->
        <div class="metadata-editor__section">
          <h3 class="metadata-editor__section-title">
            <TooltipLabel :label="t('metadata.licenses')" schemaPath="metadata.licenses" />
          </h3>
          <p class="metadata-editor__info">{{ t('metadata.licensesInfo') }}</p>
          <div v-if="bomLicenseEntries.length > 0" class="metadata-editor__items">
            <div
              v-for="(license, index) in bomLicenseEntries"
              :key="`bom-license-${index}`"
              class="metadata-editor__item"
            >
              <p class="metadata-editor__summary">{{ license }}</p>
            </div>
          </div>
          <p v-else class="metadata-editor__empty">No BOM licenses added yet.</p>
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

  &__summary {
    font-size: $text-sm;
    color: $text-primary;
    margin: 0;
    word-break: break-word;
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
