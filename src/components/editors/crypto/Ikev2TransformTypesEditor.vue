<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElInput, ElSwitch } from 'element-plus'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const updateField = (field: string, value: any) => {
  const updated = { ...(props.modelValue || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete updated[field]
  }
  // Remove empty object
  const keys = Object.keys(updated).filter(k => updated[k] !== undefined && updated[k] !== '')
  if (keys.length === 0) {
    emit('update:modelValue', undefined)
  } else {
    emit('update:modelValue', updated)
  }
}

/**
 * Parse comma-separated name strings into array of objects with name property.
 * IKEv2 encr/prf/integ/ke are arrays of objects with a name field.
 */
const parseNameArray = (value: string): any[] | undefined => {
  const items = value.split(',').map(s => s.trim()).filter(s => s.length > 0)
  return items.length > 0 ? items.map(name => ({ name })) : undefined
}

const joinNameArray = (arr: any[] | undefined): string => {
  if (!arr || !Array.isArray(arr)) return ''
  return arr.map(item => typeof item === 'string' ? item : item?.name || '').join(', ')
}
</script>

<template>
  <div class="ikev2-editor">
    <!-- ENCR -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.ikev2Encr')" schemaPath="cryptoProperties.protocolProperties.ikev2TransformTypes.encr" />
      </template>
      <ElInput
        :model-value="joinNameArray(modelValue?.encr)"
        :placeholder="t('component.cryptoProperties.protocolProperties.ikev2EncrPlaceholder')"
        class="ikev2-editor__input"
        @update:model-value="updateField('encr', parseNameArray($event))"
      />
    </ElFormItem>

    <!-- PRF -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.ikev2Prf')" schemaPath="cryptoProperties.protocolProperties.ikev2TransformTypes.prf" />
      </template>
      <ElInput
        :model-value="joinNameArray(modelValue?.prf)"
        :placeholder="t('component.cryptoProperties.protocolProperties.ikev2PrfPlaceholder')"
        class="ikev2-editor__input"
        @update:model-value="updateField('prf', parseNameArray($event))"
      />
    </ElFormItem>

    <!-- INTEG -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.ikev2Integ')" schemaPath="cryptoProperties.protocolProperties.ikev2TransformTypes.integ" />
      </template>
      <ElInput
        :model-value="joinNameArray(modelValue?.integ)"
        :placeholder="t('component.cryptoProperties.protocolProperties.ikev2IntegPlaceholder')"
        class="ikev2-editor__input"
        @update:model-value="updateField('integ', parseNameArray($event))"
      />
    </ElFormItem>

    <!-- KE -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.ikev2Ke')" schemaPath="cryptoProperties.protocolProperties.ikev2TransformTypes.ke" />
      </template>
      <ElInput
        :model-value="joinNameArray(modelValue?.ke)"
        :placeholder="t('component.cryptoProperties.protocolProperties.ikev2KePlaceholder')"
        class="ikev2-editor__input"
        @update:model-value="updateField('ke', parseNameArray($event))"
      />
    </ElFormItem>

    <!-- ESN -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.ikev2Esn')" schemaPath="cryptoProperties.protocolProperties.ikev2TransformTypes.esn" />
      </template>
      <ElSwitch
        :model-value="modelValue?.esn || false"
        @update:model-value="updateField('esn', $event)"
      />
    </ElFormItem>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.ikev2-editor {
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
