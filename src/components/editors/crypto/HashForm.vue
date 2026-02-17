<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'

interface Props {
  modelValue?: { alg?: string; content?: string }
  label?: string
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const ALGORITHMS = [
  'MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512',
  'SHA3-256', 'SHA3-384', 'SHA3-512',
  'BLAKE2b-256', 'BLAKE2b-384', 'BLAKE2b-512', 'BLAKE3',
  'Streebog-256', 'Streebog-512'
]

const updateField = (field: string, value: any) => {
  const updated: Record<string, any> = { ...(props.modelValue || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete updated[field]
  }
  // If both fields are empty, emit undefined
  if (!updated.alg && !updated.content) {
    emit('update:modelValue', undefined)
  } else {
    emit('update:modelValue', updated)
  }
}
</script>

<template>
  <div class="hash-form">
    <ElFormItem>
      <template #label>
        {{ label || t('component.cryptoProperties.common.fingerprintAlg') }}
      </template>
      <ElSelect
        :model-value="modelValue?.alg"
        clearable
        class="hash-form__select"
        @update:model-value="updateField('alg', $event)"
      >
        <ElOption v-for="a in ALGORITHMS" :key="a" :label="a" :value="a" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem>
      <template #label>
        {{ t('component.cryptoProperties.common.fingerprintContent') }}
      </template>
      <ElInput
        :model-value="modelValue?.content"
        :placeholder="t('component.cryptoProperties.common.fingerprintContentPlaceholder')"
        class="hash-form__input"
        @update:model-value="updateField('content', $event)"
      />
    </ElFormItem>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.hash-form {
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
  }
}
</style>
