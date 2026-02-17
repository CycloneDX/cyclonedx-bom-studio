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

const predefinedStates = [
  'pre-activation', 'active', 'suspended', 'deactivated', 'revoked', 'destroyed'
]

const items = (): any[] => props.modelValue || []

const addItem = () => {
  const updated = [...items(), { state: 'active' }]
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
</script>

<template>
  <div class="cert-state-editor">
    <div class="cert-state-editor__toolbar">
      <span class="cert-state-editor__label">{{ t('component.cryptoProperties.certificateProperties.certificateState') }}</span>
      <AddButton size="small" @click="addItem" />
    </div>

    <ElTable
      v-if="items().length > 0"
      :data="items()"
      stripe
      class="cert-state-editor__table"
    >
      <ElTableColumn :label="t('component.cryptoProperties.certificateProperties.state')" min-width="180">
        <template #default="{ row, $index }">
          <ElSelect
            :model-value="row.state"
            clearable
            class="cert-state-editor__select"
            @update:model-value="updateItem($index, 'state', $event)"
          >
            <ElOption v-for="s in predefinedStates" :key="s" :label="s" :value="s" />
          </ElSelect>
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

.cert-state-editor {
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
}

@include element-popper;
</style>
