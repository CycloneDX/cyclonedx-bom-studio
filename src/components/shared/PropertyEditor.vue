<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElInput } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface Property {
  name: string
  value: string
}

interface Props {
  modelValue?: Property[]
}

interface Emits {
  (e: 'update:modelValue', value: Property[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const properties = reactive<Property[]>([])

// Initialize from props
if (props.modelValue) {
  properties.push(...JSON.parse(JSON.stringify(props.modelValue)))
}

const addProperty = () => {
  properties.push({ name: '', value: '' })
  emitUpdate()
}

const removeProperty = (index: number) => {
  properties.splice(index, 1)
  emitUpdate()
}

const updateProperty = (index: number, field: keyof Property, value: string) => {
  const prop = properties[index]
  if (!prop) return
  if (field === 'name') {
    prop.name = value
  } else if (field === 'value') {
    prop.value = value
  }
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', properties)
}
</script>

<template>
  <div class="property-editor">
    <div class="property-editor__toolbar">
      <h3 class="property-editor__title">{{ t('forms.property.title') }}</h3>
      <AddButton size="small" @click="addProperty" />
    </div>

    <div class="property-editor__table-wrapper">
      <ElTable
        :data="properties"
        stripe
        class="property-editor__table"
        empty-text="No properties"
      >
        <ElTableColumn
          prop="name"
          :label="t('forms.property.name')"
          resizable
        >
          <template #default="{ row, $index }">
            <ElInput
              :model-value="row.name"
              :placeholder="t('forms.property.namePlaceholder')"
              class="property-editor__input"
              @update:model-value="updateProperty($index, 'name', $event)"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="value"
          :label="t('forms.property.value')"
          resizable
        >
          <template #default="{ row, $index }">
            <ElInput
              :model-value="row.value"
              :placeholder="t('forms.property.valuePlaceholder')"
              class="property-editor__input"
              @update:model-value="updateProperty($index, 'value', $event)"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn
          label=""
          width="80"
          fixed="right"
        >
          <template #default="{ $index }">
            <RowActions
              :show-edit="false"
              @delete="removeProperty($index)"
            />
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.property-editor {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 100%;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
  }

  &__title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0;
  }

  &__table-wrapper {
    overflow-x: auto;
    border: 1px solid $border-default;
    border-radius: $radius-md;
    background-color: $bg-surface;
  }

  &__table {
    width: 100%;
    @include element-table-compact;
  }

  &__input {
    width: 100%;
    @include element-input;

    :deep(.el-input__inner) {
      font-size: $text-sm;
    }
  }
}
</style>
