<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import DataGovernanceEditor from '@/components/editors/data/DataGovernanceEditor.vue'
import SensitiveDataEditor from '@/components/editors/data/SensitiveDataEditor.vue'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const dataTypes = ['source-code', 'configuration', 'dataset', 'definition', 'other']

/**
 * data on a component is an array of componentData objects.
 * For simplicity, we edit the first entry; add creates a new blank one.
 */
const firstData = computed(() => {
  const arr = props.modelValue
  if (Array.isArray(arr) && arr.length > 0) return arr[0]
  return undefined
})

const updateData = (field: string, value: any) => {
  const current = firstData.value || {}
  const updated = { ...current, [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete updated[field]
  }
  // Wrap in array
  const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  if (arr.length > 0) {
    arr[0] = updated
  } else {
    arr.push(updated)
  }
  emit('update:modelValue', arr)
}

const updateContents = (field: string, value: any) => {
  const contents = { ...(firstData.value?.contents || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete contents[field]
  }
  const keys = Object.keys(contents).filter(k => contents[k] !== undefined && contents[k] !== '')
  updateData('contents', keys.length > 0 ? contents : undefined)
}

const updateAttachment = (field: string, value: any) => {
  const attachment = { ...(firstData.value?.contents?.attachment || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete attachment[field]
  }
  const keys = Object.keys(attachment).filter(k => attachment[k] !== undefined && attachment[k] !== '')
  updateContents('attachment', keys.length > 0 ? attachment : undefined)
}
</script>

<template>
  <div class="data-props">
    <!-- Data Type (required) -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.dataType')" schemaPath="componentData.type" />
      </template>
      <ElSelect
        :model-value="firstData?.type"
        class="data-props__select"
        @update:model-value="updateData('type', $event)"
      >
        <ElOption v-for="dt in dataTypes" :key="dt" :label="dt" :value="dt" />
      </ElSelect>
    </ElFormItem>

    <!-- Name -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.dataName')" schemaPath="componentData.name" />
      </template>
      <ElInput
        :model-value="firstData?.name"
        :placeholder="t('component.dataSection.dataNamePlaceholder')"
        class="data-props__input"
        @update:model-value="updateData('name', $event)"
      />
    </ElFormItem>

    <!-- Description -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.description')" schemaPath="componentData.description" />
      </template>
      <ElInput
        :model-value="firstData?.description"
        type="textarea"
        :rows="3"
        :placeholder="t('component.dataSection.descriptionPlaceholder')"
        class="data-props__input"
        @update:model-value="updateData('description', $event)"
      />
    </ElFormItem>

    <!-- Classification -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.classification')" schemaPath="componentData.classification" />
      </template>
      <ElInput
        :model-value="firstData?.classification"
        :placeholder="t('component.dataSection.classificationPlaceholder')"
        class="data-props__input"
        @update:model-value="updateData('classification', $event)"
      />
    </ElFormItem>

    <!-- Contents: URL -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.contentsUrl')" schemaPath="componentData.contents.url" />
      </template>
      <ElInput
        :model-value="firstData?.contents?.url"
        :placeholder="t('component.dataSection.contentsUrlPlaceholder')"
        class="data-props__input"
        @update:model-value="updateContents('url', $event)"
      />
    </ElFormItem>

    <!-- Contents: Attachment Content Type -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.attachmentContentType')" schemaPath="componentData.contents.attachment.contentType" />
      </template>
      <ElInput
        :model-value="firstData?.contents?.attachment?.contentType"
        :placeholder="t('component.dataSection.attachmentContentTypePlaceholder')"
        class="data-props__input"
        @update:model-value="updateAttachment('contentType', $event)"
      />
    </ElFormItem>

    <!-- Contents: Attachment Encoding -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.attachmentEncoding')" schemaPath="componentData.contents.attachment.encoding" />
      </template>
      <ElSelect
        :model-value="firstData?.contents?.attachment?.encoding"
        clearable
        class="data-props__select"
        @update:model-value="updateAttachment('encoding', $event)"
      >
        <ElOption label="base64" value="base64" />
      </ElSelect>
    </ElFormItem>

    <!-- Contents: Attachment Content -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.dataSection.attachmentContent')" schemaPath="componentData.contents.attachment.content" />
      </template>
      <ElInput
        :model-value="firstData?.contents?.attachment?.content"
        type="textarea"
        :rows="3"
        :placeholder="t('component.dataSection.attachmentContentPlaceholder')"
        class="data-props__input"
        @update:model-value="updateAttachment('content', $event)"
      />
    </ElFormItem>

    <!-- Sensitive Data -->
    <SensitiveDataEditor
      :model-value="firstData?.sensitiveData"
      @update:model-value="updateData('sensitiveData', $event)"
    />

    <!-- Governance -->
    <DataGovernanceEditor
      :model-value="firstData?.governance"
      @update:model-value="updateData('governance', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.data-props {
  &__select,
  &__input {
    width: 100%;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
    }

    :deep(.el-input__inner) {
      color: $text-primary;
    }

    :deep(.el-textarea__inner) {
      background-color: $bg-input;
      color: $text-primary;
    }
  }

  &__select {
    @include element-select;
  }
}

@include element-popper;
</style>
