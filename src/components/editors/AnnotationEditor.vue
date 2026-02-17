<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElTable, ElTableColumn, ElButton,
  ElEmpty, ElDialog, ElForm, ElFormItem, ElInput, ElSelect,
  ElOption, ElDivider, ElMessage
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import { useFormValidation } from '@/composables/useFormValidation'
import OrganizationForm from '@/components/shared/OrganizationForm.vue'
import RowActions from '@/components/shared/RowActions.vue'
import ContactForm from '@/components/shared/ContactForm.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import { v4 as uuidv4 } from 'uuid'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import EditorCard from '@/components/shared/EditorCard.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

// Dialog state
const dialogVisible = ref(false)
const editingIndex = ref(-1)
const editingAnnotation = ref<any>({})

// All bom-refs for subject selection
const allRefs = computed(() => {
  const refs = [
    ...bomStore.bom.components.map((c: any) => ({
      label: `${c.name || 'Unnamed'} (${c.type || 'component'})`,
      value: c['bom-ref']
    })),
    ...bomStore.bom.services.map((s: any) => ({
      label: `${s.name || 'Unnamed'} (service)`,
      value: s['bom-ref']
    }))
  ]
  return refs
})

// Annotator type options
const annotatorTypes = [
  { label: t('annotations.annotatorTypes.organization'), value: 'organization' },
  { label: t('annotations.annotatorTypes.individual'), value: 'individual' },
  { label: t('annotations.annotatorTypes.component'), value: 'component' },
  { label: t('annotations.annotatorTypes.service'), value: 'service' }
]

// Current annotator type (derived from which sub-key exists)
const currentAnnotatorType = computed(() => {
  const ann = editingAnnotation.value.annotator
  if (!ann) return 'organization'
  if (ann.organization) return 'organization'
  if (ann.individual) return 'individual'
  if (ann.component) return 'component'
  if (ann.service) return 'service'
  return 'organization'
})

// Get display text for annotator
const getAnnotatorDisplay = (annotation: any) => {
  const ann = annotation.annotator
  if (!ann) return '—'
  if (ann.organization?.name) return `${ann.organization.name} (${t('annotations.annotatorTypes.organization')})`
  if (ann.individual?.name) return `${ann.individual.name} (${t('annotations.annotatorTypes.individual')})`
  if (ann.component?.name) return `${ann.component.name} (${t('annotations.annotatorTypes.component')})`
  if (ann.service?.name) return `${ann.service.name} (${t('annotations.annotatorTypes.service')})`
  return '—'
}

// Get display text for subjects
const getSubjectsDisplay = (annotation: any) => {
  if (!annotation.subjects || annotation.subjects.length === 0) return '—'
  return annotation.subjects.map((ref: string) => {
    const found = allRefs.value.find(r => r.value === ref)
    return found ? found.label : ref.substring(0, 8) + '…'
  }).join(', ')
}

// Truncate text for table display
const truncateText = (text: string, max: number = 60) => {
  if (!text) return '—'
  return text.length > max ? text.substring(0, max) + '…' : text
}

const annotationFormRef = ref<FormInstance>()
const { noWhitespaceOnly } = useFormValidation()

const annotationFormRules: FormRules = {
  text: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { validator: noWhitespaceOnly, trigger: 'blur' }
  ]
}

// Create new annotation
const addAnnotation = () => {
  editingIndex.value = -1
  editingAnnotation.value = {
    'bom-ref': uuidv4(),
    subjects: [],
    annotator: {
      organization: { name: '' }
    },
    timestamp: new Date().toISOString(),
    text: ''
  }
  dialogVisible.value = true
}

// Edit existing annotation
const editAnnotation = (index: number) => {
  editingIndex.value = index
  editingAnnotation.value = JSON.parse(JSON.stringify(bomStore.bom.annotations[index]))
  dialogVisible.value = true
}

// Save annotation (add or update)
const saveAnnotation = async () => {
  if (annotationFormRef.value) {
    try {
      await annotationFormRef.value.validate()
    } catch {
      ElMessage.warning(t('validation.fixErrors'))
      return
    }
  }
  // Trim text before saving
  if (typeof editingAnnotation.value.text === 'string') {
    editingAnnotation.value.text = editingAnnotation.value.text.trim()
  }
  if (!bomStore.bom.annotations) {
    bomStore.bom.annotations = []
  }
  if (editingIndex.value >= 0) {
    bomStore.bom.annotations[editingIndex.value] = editingAnnotation.value
  } else {
    bomStore.bom.annotations.push(editingAnnotation.value)
  }
  bomStore.markModified()
  dialogVisible.value = false
}

// Remove annotation
const removeAnnotation = (index: number) => {
  bomStore.bom.annotations.splice(index, 1)
  bomStore.markModified()
}

// Cancel editing
const cancelEdit = () => {
  dialogVisible.value = false
}

// Update annotation fields
const updateAnnotationField = (field: string, value: any) => {
  editingAnnotation.value[field] = value
}

// Change annotator type
const changeAnnotatorType = (type: string) => {
  const newAnnotator: any = {}
  switch (type) {
    case 'organization':
      newAnnotator.organization = { name: '' }
      break
    case 'individual':
      newAnnotator.individual = { name: '', email: '', phone: '' }
      break
    case 'component':
      newAnnotator.component = { type: 'application', name: '' }
      break
    case 'service':
      newAnnotator.service = { name: '' }
      break
  }
  editingAnnotation.value.annotator = newAnnotator
}

// Update annotator sub-object
const updateAnnotatorOrg = (value: any) => {
  editingAnnotation.value.annotator = { organization: value }
}

const updateAnnotatorIndividual = (value: any) => {
  editingAnnotation.value.annotator = { individual: value }
}

const updateAnnotatorComponentField = (field: string, value: any) => {
  const comp = editingAnnotation.value.annotator?.component || {}
  editingAnnotation.value.annotator = { component: { ...comp, [field]: value } }
}

const updateAnnotatorServiceField = (field: string, value: any) => {
  const svc = editingAnnotation.value.annotator?.service || {}
  editingAnnotation.value.annotator = { service: { ...svc, [field]: value } }
}
</script>

<template>
  <div class="annotation-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('annotations.title')" :show-add-button="true" @add="addAnnotation">
        <template #title>
          <TooltipLabel :label="t('annotations.title')" schemaPath="bom.annotations" />
        </template>

        <div class="annotation-editor__content">
          <ElTable
            v-if="bomStore.bom.annotations && bomStore.bom.annotations.length > 0"
            :data="bomStore.bom.annotations"
            class="annotation-editor__table"
          >
            <!-- Annotator Column -->
            <ElTableColumn
              :label="t('annotations.annotator')"
              width="220"
            >
              <template #default="{ row }">
                {{ getAnnotatorDisplay(row) }}
              </template>
            </ElTableColumn>

            <!-- Text Column -->
            <ElTableColumn
              :label="t('annotations.text')"
              :min-width="180"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.text || '—' }}
              </template>
            </ElTableColumn>

            <!-- Subjects Column -->
            <ElTableColumn
              :label="t('annotations.subjects')"
              width="220"
            >
              <template #default="{ row }">
                {{ getSubjectsDisplay(row) }}
              </template>
            </ElTableColumn>

            <!-- Timestamp Column -->
            <ElTableColumn
              :label="t('annotations.timestamp')"
              width="180"
            >
              <template #default="{ row }">
                {{ row.timestamp ? new Date(row.timestamp).toLocaleString() : '—' }}
              </template>
            </ElTableColumn>

            <!-- Actions Column -->
            <ElTableColumn
              label=""
              width="100"
              fixed="right"
            >
              <template #default="{ $index }">
                <RowActions
                  @edit="editAnnotation($index)"
                  @delete="removeAnnotation($index)"
                />
              </template>
            </ElTableColumn>
          </ElTable>

          <ElEmpty v-else :description="t('annotations.noAnnotations')" />
        </div>
      </EditorCard>

      <!-- Edit/Add Dialog -->
      <ElDialog
        :model-value="dialogVisible"
        :title="editingIndex >= 0 ? t('annotations.editAnnotation') : t('annotations.addAnnotation')"
        width="80%"
        :close-on-click-modal="false"
        @update:model-value="(val) => !val && cancelEdit()"
      >
      <div class="annotation-editor__dialog-body">
        <ElForm ref="annotationFormRef" :model="editingAnnotation" :rules="annotationFormRules" label-width="160px" class="annotation-editor__form">

          <!-- Text -->
          <ElFormItem prop="text" required>
            <template #label>
              <TooltipLabel :label="t('annotations.text')" schemaPath="annotations.text" />
            </template>
            <ElInput
              :model-value="editingAnnotation.text"
              type="textarea"
              :rows="4"
              :placeholder="t('annotations.textPlaceholder')"
              class="annotation-editor__input"
              @update:model-value="updateAnnotationField('text', $event)"
            />
          </ElFormItem>

          <!-- Subjects -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('annotations.subjects')" schemaPath="annotations.subjects" />
            </template>
            <ElSelect
              :model-value="editingAnnotation.subjects || []"
              multiple
              filterable
              class="annotation-editor__select"
              :placeholder="t('annotations.subjectsPlaceholder')"
              @update:model-value="updateAnnotationField('subjects', $event)"
            >
              <ElOption
                v-for="ref in allRefs"
                :key="ref.value"
                :label="ref.label"
                :value="ref.value"
              />
            </ElSelect>
          </ElFormItem>

          <!-- Timestamp -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('annotations.timestamp')" schemaPath="annotations.timestamp" />
            </template>
            <ElInput
              :model-value="editingAnnotation.timestamp"
              :placeholder="t('annotations.timestampPlaceholder')"
              class="annotation-editor__input"
              @update:model-value="updateAnnotationField('timestamp', $event)"
            />
          </ElFormItem>

          <!-- Annotator -->
          <ElDivider>{{ t('annotations.annotator') }}</ElDivider>

          <!-- Annotator Type Selector -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('annotations.annotatorType')" schemaPath="annotations.annotator" />
            </template>
            <ElSelect
              :model-value="currentAnnotatorType"
              class="annotation-editor__select"
              @update:model-value="changeAnnotatorType($event)"
            >
              <ElOption
                v-for="at in annotatorTypes"
                :key="at.value"
                :label="at.label"
                :value="at.value"
              />
            </ElSelect>
          </ElFormItem>

          <!-- Organization Annotator -->
          <template v-if="currentAnnotatorType === 'organization'">
            <OrganizationForm
              :model-value="editingAnnotation.annotator?.organization"
              :label="t('annotations.annotatorTypes.organization')"
              @update:model-value="updateAnnotatorOrg($event)"
            />
          </template>

          <!-- Individual Annotator -->
          <template v-if="currentAnnotatorType === 'individual'">
            <div class="annotation-editor__individual-section">
              <h4 class="annotation-editor__section-label">{{ t('annotations.annotatorTypes.individual') }}</h4>
              <ContactForm
                :model-value="editingAnnotation.annotator?.individual"
                @update:model-value="updateAnnotatorIndividual($event)"
              />
            </div>
          </template>

          <!-- Component Annotator -->
          <template v-if="currentAnnotatorType === 'component'">
            <ElFormItem>
              <template #label>
                <TooltipLabel :label="t('annotations.componentName')" schemaPath="component.name" />
              </template>
              <ElInput
                :model-value="editingAnnotation.annotator?.component?.name"
                :placeholder="t('component.namePlaceholder')"
                class="annotation-editor__input"
                @update:model-value="updateAnnotatorComponentField('name', $event)"
              />
            </ElFormItem>
            <ElFormItem :label="t('component.type')">
              <ElSelect
                :model-value="editingAnnotation.annotator?.component?.type || 'application'"
                class="annotation-editor__select"
                @update:model-value="updateAnnotatorComponentField('type', $event)"
              >
                <ElOption label="Application" value="application" />
                <ElOption label="Library" value="library" />
                <ElOption label="Framework" value="framework" />
                <ElOption label="Container" value="container" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="t('component.version')">
              <ElInput
                :model-value="editingAnnotation.annotator?.component?.version"
                :placeholder="t('component.versionPlaceholder')"
                class="annotation-editor__input"
                @update:model-value="updateAnnotatorComponentField('version', $event)"
              />
            </ElFormItem>
          </template>

          <!-- Service Annotator -->
          <template v-if="currentAnnotatorType === 'service'">
            <ElFormItem>
              <template #label>
                <TooltipLabel :label="t('annotations.serviceName')" schemaPath="service.name" />
              </template>
              <ElInput
                :model-value="editingAnnotation.annotator?.service?.name"
                :placeholder="t('service.namePlaceholder')"
                class="annotation-editor__input"
                @update:model-value="updateAnnotatorServiceField('name', $event)"
              />
            </ElFormItem>
            <ElFormItem :label="t('service.description')">
              <ElInput
                :model-value="editingAnnotation.annotator?.service?.description"
                type="textarea"
                :rows="2"
                :placeholder="t('service.descriptionPlaceholder')"
                class="annotation-editor__input"
                @update:model-value="updateAnnotatorServiceField('description', $event)"
              />
            </ElFormItem>
          </template>
        </ElForm>
      </div>

      <template #footer>
        <div class="annotation-editor__footer">
          <ElButton @click="cancelEdit">
            {{ t('common.cancel') }}
          </ElButton>
          <ElButton
            type="primary"
            @click="saveAnnotation"
          >
            {{ t('common.save') }}
          </ElButton>
        </div>
      </template>
      </ElDialog>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.annotation-editor {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__actions {
    display: flex;
    gap: $space-2;
  }

  &__table {
    @include element-table;
  }

  &__dialog-body {
    max-height: 65vh;
    overflow-y: auto;
    padding: $space-2;
  }

  &__form {
    :deep(.el-form-item__label) {
      color: $text-secondary;
      font-weight: $weight-medium;
    }

    :deep(.el-form-item) {
      margin-bottom: $space-4;
    }

    :deep(.el-divider__text) {
      color: $accent-primary;
      font-weight: $weight-semibold;
      font-size: $text-sm;
      background-color: $bg-surface;
    }
  }

  &__select,
  &__input {
    @include element-input;
  }

  &__individual-section {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    padding: $space-4;
    background-color: rgba($accent-primary, 0.04);
    border: 1px solid $border-default;
    border-radius: $radius-md;
  }

  &__section-label {
    font-size: $text-md;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
  }
}
</style>
