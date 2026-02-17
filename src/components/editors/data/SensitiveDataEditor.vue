<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElInput } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface Props {
  modelValue?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string[] | undefined): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const items = (): string[] => props.modelValue || []

const addItem = () => {
  const updated = [...items(), '']
  emit('update:modelValue', updated)
}

const removeItem = (index: number) => {
  const updated = [...items()]
  updated.splice(index, 1)
  emit('update:modelValue', updated.length > 0 ? updated : undefined)
}

const updateItem = (index: number, value: string) => {
  const updated = [...items()]
  updated[index] = value
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="sensitive-data-editor">
    <div class="sensitive-data-editor__toolbar">
      <span class="sensitive-data-editor__label">{{ t('component.dataSection.sensitiveData') }}</span>
      <AddButton size="small" @click="addItem" />
    </div>

    <ElTable
      v-if="items().length > 0"
      :data="items().map((v, i) => ({ value: v, index: i }))"
      stripe
      class="sensitive-data-editor__table"
    >
      <ElTableColumn :label="t('component.dataSection.sensitiveDataDescription')" min-width="300">
        <template #default="{ row }">
          <ElInput
            :model-value="row.value"
            :placeholder="t('component.dataSection.sensitiveDataPlaceholder')"
            class="sensitive-data-editor__input"
            @update:model-value="updateItem(row.index, $event)"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn label="" width="60" fixed="right">
        <template #default="{ row }">
          <RowActions :show-edit="false" @delete="removeItem(row.index)" />
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.sensitive-data-editor {
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
