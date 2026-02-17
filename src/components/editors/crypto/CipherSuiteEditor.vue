<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElInput } from 'element-plus'
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

const items = (): any[] => props.modelValue || []

const addItem = () => {
  const updated = [...items(), { name: '', identifiers: [], algorithms: [] }]
  emit('update:modelValue', updated)
}

const removeItem = (index: number) => {
  const updated = [...items()]
  updated.splice(index, 1)
  emit('update:modelValue', updated.length > 0 ? updated : undefined)
}

const updateItem = (index: number, field: string, value: any) => {
  const updated = [...items()]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:modelValue', updated)
}

const parseCommaSeparated = (value: string): string[] => {
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0)
}

const joinArray = (arr: any[]): string => {
  if (!arr || !Array.isArray(arr)) return ''
  return arr.join(', ')
}
</script>

<template>
  <div class="cipher-suite-editor">
    <div class="cipher-suite-editor__toolbar">
      <span class="cipher-suite-editor__label">{{ t('component.cryptoProperties.protocolProperties.cipherSuites') }}</span>
      <AddButton size="small" @click="addItem" />
    </div>

    <ElTable
      v-if="items().length > 0"
      :data="items()"
      stripe
      class="cipher-suite-editor__table"
    >
      <ElTableColumn :label="t('component.cryptoProperties.protocolProperties.cipherSuiteName')" min-width="200">
        <template #default="{ row, $index }">
          <ElInput
            :model-value="row.name"
            :placeholder="t('component.cryptoProperties.protocolProperties.cipherSuiteNamePlaceholder')"
            class="cipher-suite-editor__input"
            @update:model-value="updateItem($index, 'name', $event)"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn :label="t('component.cryptoProperties.protocolProperties.cipherSuiteIdentifiers')" min-width="200">
        <template #default="{ row, $index }">
          <ElInput
            :model-value="joinArray(row.identifiers)"
            :placeholder="t('component.cryptoProperties.protocolProperties.cipherSuiteIdentifiersPlaceholder')"
            class="cipher-suite-editor__input"
            @update:model-value="updateItem($index, 'identifiers', parseCommaSeparated($event))"
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

.cipher-suite-editor {
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
