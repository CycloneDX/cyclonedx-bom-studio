<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElTable, ElTableColumn, ElButton, ElIcon, ElInput, ElSelect,
  ElOption, ElEmpty, ElAlert, ElForm, ElFormItem, ElTag,
  ElDialog, ElRadioGroup, ElRadioButton, ElDivider, ElMessage
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Warning, InfoFilled } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import { useSpecVersionGating } from '@/composables/useSpecVersionGating'
import { useFormValidation } from '@/composables/useFormValidation'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import RowActions from '@/components/shared/RowActions.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()
const { supportsCitations, featureUnavailableMessage } = useSpecVersionGating()

const dialogVisible = ref(false)
const editingIndex = ref<number | null>(null)

// Form model for the citation dialog
const form = ref({
  'bom-ref': '',
  pointerMode: 'expressions' as 'pointers' | 'expressions',
  pointers: [] as string[],
  expressions: [] as string[],
  timestamp: '',
  attributionMode: 'attributedTo' as 'attributedTo' | 'process' | 'both',
  attributedTo: '',
  process: '',
  note: ''
})

const newPointer = ref('')
const newExpression = ref('')
const citationFormRef = ref<FormInstance>()

const { noWhitespaceOnly } = useFormValidation()

const citationFormRules: FormRules = {
  timestamp: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { validator: noWhitespaceOnly, trigger: 'blur' }
  ]
}

// BOM refs that can be attributed to (components, services, tools)
const attributableRefs = computed(() => {
  const refs: { label: string; value: string }[] = []
  bomStore.bom.components.forEach((c: any) => {
    if (c['bom-ref']) {
      refs.push({ label: `${c.name || 'Unnamed'} (${c.type || 'component'})`, value: c['bom-ref'] })
    }
  })
  bomStore.bom.services.forEach((s: any) => {
    if (s['bom-ref']) {
      refs.push({ label: `${s.name || 'Unnamed'} (service)`, value: s['bom-ref'] })
    }
  })
  // Metadata tool components
  if (bomStore.bom.metadata?.tools?.components) {
    bomStore.bom.metadata.tools.components.forEach((t: any) => {
      if (t['bom-ref']) {
        refs.push({ label: `${t.name || 'Unnamed'} (tool)`, value: t['bom-ref'] })
      }
    })
  }
  // Metadata authors
  if (bomStore.bom.metadata?.authors) {
    bomStore.bom.metadata.authors.forEach((a: any) => {
      if (a['bom-ref']) {
        refs.push({ label: `${a.name || 'Unnamed'} (author)`, value: a['bom-ref'] })
      }
    })
  }
  return refs
})

const resetForm = () => {
  form.value = {
    'bom-ref': '',
    pointerMode: 'expressions',
    pointers: [],
    expressions: [],
    timestamp: new Date().toISOString(),
    attributionMode: 'attributedTo',
    attributedTo: '',
    process: '',
    note: ''
  }
  newPointer.value = ''
  newExpression.value = ''
}

const openAddDialog = () => {
  editingIndex.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (index: number) => {
  editingIndex.value = index
  const citation = bomStore.bom.citations[index]
  form.value = {
    'bom-ref': citation['bom-ref'] || '',
    pointerMode: citation.pointers?.length > 0 ? 'pointers' : 'expressions',
    pointers: [...(citation.pointers || [])],
    expressions: [...(citation.expressions || [])],
    timestamp: citation.timestamp || '',
    attributionMode: citation.attributedTo && citation.process ? 'both' : citation.process ? 'process' : 'attributedTo',
    attributedTo: citation.attributedTo || '',
    process: citation.process || '',
    note: citation.note || ''
  }
  newPointer.value = ''
  newExpression.value = ''
  dialogVisible.value = true
}

const addPointer = () => {
  const val = newPointer.value.trim()
  if (val && !form.value.pointers.includes(val)) {
    form.value.pointers.push(val)
    newPointer.value = ''
  }
}

const removePointer = (index: number) => {
  form.value.pointers.splice(index, 1)
}

const addExpression = () => {
  const val = newExpression.value.trim()
  if (val && !form.value.expressions.includes(val)) {
    form.value.expressions.push(val)
    newExpression.value = ''
  }
}

const removeExpression = (index: number) => {
  form.value.expressions.splice(index, 1)
}

const saveCitation = async () => {
  if (citationFormRef.value) {
    try {
      await citationFormRef.value.validate()
    } catch {
      ElMessage.warning(t('validation.fixErrors'))
      return
    }
  }
  // Trim timestamp
  form.value.timestamp = form.value.timestamp.trim()

  const citation: any = {
    timestamp: form.value.timestamp
  }

  if (form.value['bom-ref']) {
    citation['bom-ref'] = form.value['bom-ref']
  }

  // Pointers vs expressions (oneOf)
  if (form.value.pointerMode === 'pointers' && form.value.pointers.length > 0) {
    citation.pointers = [...form.value.pointers]
  } else if (form.value.pointerMode === 'expressions' && form.value.expressions.length > 0) {
    citation.expressions = [...form.value.expressions]
  }

  // Attribution (anyOf: attributedTo or process)
  if (form.value.attributionMode === 'attributedTo' || form.value.attributionMode === 'both') {
    if (form.value.attributedTo) citation.attributedTo = form.value.attributedTo
  }
  if (form.value.attributionMode === 'process' || form.value.attributionMode === 'both') {
    if (form.value.process) citation.process = form.value.process
  }

  if (form.value.note) {
    citation.note = form.value.note
  }

  if (editingIndex.value !== null) {
    bomStore.bom.citations[editingIndex.value] = citation
  } else {
    bomStore.addCitation(citation)
  }
  bomStore.markModified()
  dialogVisible.value = false
}

const removeCitation = (index: number) => {
  bomStore.removeCitation(index)
}

// Display helpers
const getRefName = (bomRef: string): string => {
  const match = attributableRefs.value.find(r => r.value === bomRef)
  return match?.label || bomRef.substring(0, 16) + '…'
}

const formatTimestamp = (ts: string): string => {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}
</script>

<template>
  <div class="citation-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard
        :title="t('citations.title')"
        :show-add-button="supportsCitations"
        @add="openAddDialog"
      >
        <template #title>
          <TooltipLabel :label="t('citations.title')" schemaPath="bom.citations" />
        </template>

        <!-- Version gate alert -->
        <ElAlert
          v-if="!supportsCitations"
          :title="featureUnavailableMessage('Citations', '1.7')"
          type="warning"
          :closable="false"
          show-icon
          class="citation-editor__version-alert"
        />

        <template v-else>
        <p class="citation-editor__description">
          {{ t('citations.noData') }}
        </p>

        <!-- Citations table -->
        <ElTable
          v-if="bomStore.bom.citations.length > 0"
          :data="bomStore.bom.citations"
          class="citation-editor__table"
        >
          <ElTableColumn :label="t('citations.timestamp')" width="180">
            <template #default="{ row }">
              <span class="citation-editor__ts">{{ formatTimestamp(row.timestamp) }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn :label="t('citations.targetFields')" min-width="200">
            <template #default="{ row }">
              <div class="citation-editor__field-tags">
                <template v-if="row.pointers?.length">
                  <ElTag
                    v-for="(p, i) in row.pointers.slice(0, 3)"
                    :key="'p' + i"
                    size="small"
                    type="info"
                    class="citation-editor__tag"
                  >{{ p }}</ElTag>
                  <ElTag v-if="row.pointers.length > 3" size="small" type="info">+{{ row.pointers.length - 3 }}</ElTag>
                </template>
                <template v-else-if="row.expressions?.length">
                  <ElTag
                    v-for="(e, i) in row.expressions.slice(0, 3)"
                    :key="'e' + i"
                    size="small"
                    class="citation-editor__tag"
                  >{{ e }}</ElTag>
                  <ElTag v-if="row.expressions.length > 3" size="small">+{{ row.expressions.length - 3 }}</ElTag>
                </template>
                <span v-else class="citation-editor__muted">{{ t('common.none') }}</span>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn :label="t('citations.attributedTo')" min-width="180">
            <template #default="{ row }">
              <span v-if="row.attributedTo" class="citation-editor__ref-name">{{ getRefName(row.attributedTo) }}</span>
              <span v-else class="citation-editor__muted">—</span>
            </template>
          </ElTableColumn>

          <ElTableColumn :label="t('citations.process')" min-width="140">
            <template #default="{ row }">
              <span v-if="row.process" class="citation-editor__ref-name">{{ getRefName(row.process) }}</span>
              <span v-else class="citation-editor__muted">—</span>
            </template>
          </ElTableColumn>

          <ElTableColumn :label="t('citations.note')" min-width="160">
            <template #default="{ row }">
              <span v-if="row.note" class="citation-editor__note">{{ row.note }}</span>
              <span v-else class="citation-editor__muted">—</span>
            </template>
          </ElTableColumn>

          <ElTableColumn label="" width="100" fixed="right">
            <template #default="{ $index }">
              <RowActions
                @edit="openEditDialog($index)"
                @delete="removeCitation($index)"
              />
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty v-else :description="t('citations.noData')" />
      </template>

      <!-- Add/Edit Citation Dialog -->
      <ElDialog
      v-model="dialogVisible"
      :title="editingIndex !== null ? t('citations.editCitation') : t('citations.addCitation')"
      width="600px"
      class="citation-editor__dialog"
      :close-on-click-modal="false"
    >
      <ElForm ref="citationFormRef" :model="form" :rules="citationFormRules" label-position="top" class="citation-editor__form">
        <!-- Timestamp -->
        <ElFormItem prop="timestamp" :label="t('citations.timestamp')" required>
          <ElInput v-model="form.timestamp" :placeholder="t('citations.timestampPlaceholder')" />
        </ElFormItem>

        <!-- Pointer mode selector -->
        <ElFormItem :label="t('citations.targetFieldType')">
          <ElRadioGroup v-model="form.pointerMode" size="small">
            <ElRadioButton value="expressions">{{ t('citations.pathExpressions') }}</ElRadioButton>
            <ElRadioButton value="pointers">{{ t('citations.jsonPointers') }}</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>

        <!-- Expressions -->
        <ElFormItem v-if="form.pointerMode === 'expressions'" :label="t('citations.pathExpressions')">
          <div class="citation-editor__tag-input-wrap">
            <div class="citation-editor__tag-list">
              <ElTag
                v-for="(e, i) in form.expressions"
                :key="i"
                closable
                size="small"
                @close="removeExpression(i)"
              >{{ e }}</ElTag>
            </div>
            <div class="citation-editor__tag-add">
              <ElInput
                v-model="newExpression"
                :placeholder="t('citations.expressionPlaceholder')"
                size="small"
                @keyup.enter="addExpression"
              />
              <ElButton size="small" @click="addExpression" :icon="Plus" />
            </div>
          </div>
        </ElFormItem>

        <!-- Pointers -->
        <ElFormItem v-else :label="t('citations.jsonPointers')">
          <div class="citation-editor__tag-input-wrap">
            <div class="citation-editor__tag-list">
              <ElTag
                v-for="(p, i) in form.pointers"
                :key="i"
                closable
                size="small"
                type="info"
                @close="removePointer(i)"
              >{{ p }}</ElTag>
            </div>
            <div class="citation-editor__tag-add">
              <ElInput
                v-model="newPointer"
                :placeholder="t('citations.pointerPlaceholder')"
                size="small"
                @keyup.enter="addPointer"
              />
              <ElButton size="small" @click="addPointer" :icon="Plus" />
            </div>
          </div>
        </ElFormItem>

        <ElDivider />

        <!-- Attribution mode -->
        <ElFormItem :label="t('citations.attributionSource')">
          <ElRadioGroup v-model="form.attributionMode" size="small">
            <ElRadioButton value="attributedTo">{{ t('citations.attributedTo') }}</ElRadioButton>
            <ElRadioButton value="process">{{ t('citations.process') }}</ElRadioButton>
            <ElRadioButton value="both">{{ t('common.both') }}</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>

        <!-- Attributed To -->
        <ElFormItem
          v-if="form.attributionMode === 'attributedTo' || form.attributionMode === 'both'"
          :label="t('citations.attributedTo')"
        >
          <ElSelect
            v-model="form.attributedTo"
            filterable
            clearable
            allow-create
            :placeholder="t('citations.attributingEntityPlaceholder')"
            class="citation-editor__full-select"
          >
            <ElOption
              v-for="ref in attributableRefs"
              :key="ref.value"
              :label="ref.label"
              :value="ref.value"
            />
          </ElSelect>
        </ElFormItem>

        <!-- Process -->
        <ElFormItem
          v-if="form.attributionMode === 'process' || form.attributionMode === 'both'"
          :label="t('citations.process')"
        >
          <ElInput v-model="form.process" :placeholder="t('citations.processPlaceholder')" />
        </ElFormItem>

        <ElDivider />

        <!-- Note -->
        <ElFormItem :label="t('citations.note')">
          <ElInput
            v-model="form.note"
            type="textarea"
            :rows="2"
            :placeholder="t('citations.notePlaceholder')"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="saveCitation">{{ t('common.save') }}</ElButton>
      </template>
      </ElDialog>
    </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.citation-editor {
  width: 100%;

  &__version-alert {
    margin-bottom: $space-4;
  }

  &__description {
    font-size: $text-sm;
    color: $text-secondary;
    margin: 0 0 $space-4;
    padding: $space-3;
    background-color: rgba($accent-primary, 0.04);
    border-left: 2px solid $accent-primary;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &__table {
    @include element-table;
  }

  &__ts {
    font-size: $text-xs;
    color: $text-secondary;
  }

  &__field-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__tag {
    font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
    font-size: 10px;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ref-name {
    font-size: $text-xs;
    color: $text-secondary;
  }

  &__note {
    font-size: $text-xs;
    color: $text-tertiary;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  &__muted {
    color: $text-tertiary;
    font-size: $text-xs;
  }

  &__form {
    @include element-input;

    :deep(.el-form-item__label) {
      color: $text-secondary;
      font-weight: $weight-medium;
    }

    :deep(.el-textarea__inner) {
      background-color: $bg-input;
      border-color: $border-default;
      color: $text-primary;
    }
  }

  &__tag-input-wrap {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    width: 100%;
  }

  &__tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 24px;
  }

  &__tag-add {
    display: flex;
    gap: $space-2;
    align-items: center;
  }

  &__full-select {
    width: 100%;
  }
}

.citation-editor__dialog {
  :deep(.el-dialog) {
    background-color: $bg-elevated;
    border: 1px solid $border-default;
  }

  :deep(.el-dialog__title) {
    color: $text-primary;
  }

  :deep(.el-dialog__body) {
    padding: $space-4 $space-6;
  }
}
</style>
