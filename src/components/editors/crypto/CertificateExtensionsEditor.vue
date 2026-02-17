<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElSelect, ElOption, ElInput } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface Props {
  modelValue?: any[]
}

interface Emits {
  (e: 'update:modelValue', value: any[] | undefined): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const commonExtensionNames = [
  'basicConstraints', 'keyUsage', 'extendedKeyUsage',
  'subjectAlternativeName', 'authorityKeyIdentifier',
  'subjectKeyIdentifier', 'authorityInformationAccess',
  'certificatePolicies', 'crlDistributionPoints',
  'signedCertificateTimestamp'
]

const items = (): any[] => props.modelValue || []

const addItem = () => {
  const updated = [...items(), { commonExtensionName: '', commonExtensionValue: '' }]
  emit('update:modelValue', updated)
}

const removeItem = (index: number) => {
  const updated = [...items()]
  updated.splice(index, 1)
  emit('update:modelValue', updated.length > 0 ? updated : undefined)
}

const updateItem = (index: number, field: string, value: any) => {
  const updated = [...items()]
  const item = { ...updated[index] }
  // If switching to a common extension name, ensure we have commonExtensionName/Value
  if (field === 'commonExtensionName') {
    item.commonExtensionName = value
    if (!item.commonExtensionValue) item.commonExtensionValue = ''
    delete item.customExtensionName
    delete item.customExtensionValue
  } else if (field === 'customExtensionName') {
    item.customExtensionName = value
    if (!item.customExtensionValue) item.customExtensionValue = ''
    delete item.commonExtensionName
    delete item.commonExtensionValue
  } else {
    item[field] = value
  }
  updated[index] = item
  emit('update:modelValue', updated)
}

const isCommon = (row: any) => 'commonExtensionName' in row || !('customExtensionName' in row)
</script>

<template>
  <div class="cert-ext-editor">
    <div class="cert-ext-editor__toolbar">
      <span class="cert-ext-editor__label">{{ t('component.cryptoProperties.certificateProperties.certificateExtensions') }}</span>
      <AddButton size="small" @click="addItem" />
    </div>

    <ElTable
      v-if="items().length > 0"
      :data="items()"
      stripe
      class="cert-ext-editor__table"
    >
      <ElTableColumn :label="t('component.cryptoProperties.certificateProperties.extensionName')" min-width="200">
        <template #default="{ row, $index }">
          <ElSelect
            v-if="isCommon(row)"
            :model-value="row.commonExtensionName"
            clearable
            :placeholder="t('component.cryptoProperties.certificateProperties.selectExtension')"
            class="cert-ext-editor__select"
            @update:model-value="updateItem($index, 'commonExtensionName', $event)"
          >
            <ElOption v-for="ext in commonExtensionNames" :key="ext" :label="ext" :value="ext" />
          </ElSelect>
          <ElInput
            v-else
            :model-value="row.customExtensionName"
            :placeholder="t('component.cryptoProperties.certificateProperties.customExtensionNamePlaceholder')"
            class="cert-ext-editor__input"
            @update:model-value="updateItem($index, 'customExtensionName', $event)"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn :label="t('component.cryptoProperties.certificateProperties.extensionValue')" min-width="200">
        <template #default="{ row, $index }">
          <ElInput
            :model-value="isCommon(row) ? row.commonExtensionValue : row.customExtensionValue"
            :placeholder="t('component.cryptoProperties.certificateProperties.extensionValuePlaceholder')"
            class="cert-ext-editor__input"
            @update:model-value="updateItem($index, isCommon(row) ? 'commonExtensionValue' : 'customExtensionValue', $event)"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn label="" width="60" fixed="right">
        <template #default="{ $index }">
          <RowActions :show-edit="false" @delete="removeItem($index)" />
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.cert-ext-editor {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-secondary;
  }

  &__table {
    width: 100%;
    @include element-table-compact;
  }

  &__select {
    width: 100%;
    @include element-select;
  }

  &__input {
    width: 100%;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
    }

    :deep(.el-input__inner) {
      color: $text-primary;
    }
  }
}

@include element-popper;
</style>
