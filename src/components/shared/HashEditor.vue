<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElSelect, ElOption, ElInput } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface Hash {
  alg: string
  content: string
}

interface Props {
  modelValue?: Hash[]
}

interface Emits {
  (e: 'update:modelValue', value: Hash[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const ALGORITHMS = [
  'MD5',
  'SHA-1',
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'SHA3-256',
  'SHA3-384',
  'SHA3-512',
  'BLAKE2b-256',
  'BLAKE2b-384',
  'BLAKE2b-512',
  'BLAKE3'
]

const hashes = reactive<Hash[]>([])

// Initialize from props
if (props.modelValue) {
  hashes.push(...JSON.parse(JSON.stringify(props.modelValue)))
}

const addHash = () => {
  hashes.push({ alg: 'SHA-256', content: '' })
  emitUpdate()
}

const removeHash = (index: number) => {
  hashes.splice(index, 1)
  emitUpdate()
}

const updateHash = (index: number, field: keyof Hash, value: string) => {
  const hash = hashes[index]
  if (!hash) return
  if (field === 'alg') {
    hash.alg = value
  } else if (field === 'content') {
    hash.content = value
  }
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', hashes)
}
</script>

<template>
  <div class="hash-editor">
    <div class="hash-editor__toolbar">
      <h3 class="hash-editor__title">{{ t('forms.hash.title') }}</h3>
      <AddButton size="small" @click="addHash" />
    </div>

    <div class="hash-editor__table-wrapper">
      <ElTable
        :data="hashes"
        stripe
        class="hash-editor__table"
        empty-text="No hashes"
      >
        <ElTableColumn
          prop="alg"
          :label="t('forms.hash.algorithm')"
          width="200"
          resizable
        >
          <template #default="{ row, $index }">
            <ElSelect
              :model-value="row.alg"
              class="hash-editor__select"
              @update:model-value="updateHash($index, 'alg', $event)"
            >
              <ElOption
                v-for="algo in ALGORITHMS"
                :key="algo"
                :label="algo"
                :value="algo"
              />
            </ElSelect>
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="content"
          :label="t('forms.hash.value')"
          resizable
        >
          <template #default="{ row, $index }">
            <ElInput
              :model-value="row.content"
              :placeholder="t('forms.hash.valuePlaceholder')"
              class="hash-editor__input"
              @update:model-value="updateHash($index, 'content', $event)"
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
              @delete="removeHash($index)"
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

.hash-editor {
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

  &__select {
    width: 100%;
    @include element-select;
  }

  &__input {
    width: 100%;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;

      &:hover {
        border-color: $border-default;
      }
    }

    :deep(.el-input__inner) {
      color: $text-primary;
      font-size: $text-sm;
      font-family: $font-mono;

      &::placeholder {
        color: $text-secondary;
      }
    }

    :deep(.el-input.is-focus .el-input__wrapper) {
      box-shadow: 0 0 0 2px rgba($accent-primary, 0.1);
      border-color: $border-focus;
    }
  }
}

@include element-popper;
</style>
