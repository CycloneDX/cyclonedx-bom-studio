<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElInput } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface Props {
  label: string
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
  const updated = [...items(), { contact: { name: '' } }]
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

  if (field === 'contactName') {
    item.contact = { ...(item.contact || {}), name: value }
    delete item.organization
  } else if (field === 'contactEmail') {
    item.contact = { ...(item.contact || {}), email: value }
    delete item.organization
  } else if (field === 'orgName') {
    item.organization = { ...(item.organization || {}), name: value }
    delete item.contact
  }

  updated[index] = item
  emit('update:modelValue', updated)
}

const getDisplayName = (item: any): string => {
  if (item.contact?.name) return item.contact.name
  if (item.organization?.name) return item.organization.name
  return ''
}

const getDisplayEmail = (item: any): string => {
  return item.contact?.email || ''
}
</script>

<template>
  <div class="governance-party-list">
    <div class="governance-party-list__toolbar">
      <span class="governance-party-list__label">{{ label }}</span>
      <AddButton size="small" @click="addItem" />
    </div>

    <ElTable
      v-if="items().length > 0"
      :data="items()"
      stripe
      class="governance-party-list__table"
    >
      <ElTableColumn :label="t('component.dataSection.partyName')" min-width="180">
        <template #default="{ row, $index }">
          <ElInput
            :model-value="getDisplayName(row)"
            :placeholder="t('component.dataSection.partyNamePlaceholder')"
            class="governance-party-list__input"
            @update:model-value="updateItem($index, 'contactName', $event)"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn :label="t('component.dataSection.partyEmail')" min-width="200">
        <template #default="{ row, $index }">
          <ElInput
            :model-value="getDisplayEmail(row)"
            :placeholder="t('component.dataSection.partyEmailPlaceholder')"
            class="governance-party-list__input"
            @update:model-value="updateItem($index, 'contactEmail', $event)"
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

.governance-party-list {
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
