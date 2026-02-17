<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import CipherSuiteEditor from '@/components/editors/crypto/CipherSuiteEditor.vue'
import Ikev2TransformTypesEditor from '@/components/editors/crypto/Ikev2TransformTypesEditor.vue'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const protocolTypes = [
  'tls', 'ssh', 'ipsec', 'ike', 'sstp', 'wpa', 'dtls',
  'quic', 'eap-aka', 'eap-aka-prime', 'prins', '5g-aka', 'other', 'unknown'
]

const updateField = (field: string, value: any) => {
  const updated = { ...(props.modelValue || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete updated[field]
  }
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="protocol-props">
    <!-- Protocol Type -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.type')" schemaPath="cryptoProperties.protocolProperties.type" />
      </template>
      <ElSelect
        :model-value="modelValue?.type"
        clearable
        class="protocol-props__select"
        @update:model-value="updateField('type', $event)"
      >
        <ElOption v-for="pt in protocolTypes" :key="pt" :label="pt" :value="pt" />
      </ElSelect>
    </ElFormItem>

    <!-- Version -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.version')" schemaPath="cryptoProperties.protocolProperties.version" />
      </template>
      <ElInput
        :model-value="modelValue?.version"
        :placeholder="t('component.cryptoProperties.protocolProperties.versionPlaceholder')"
        class="protocol-props__input"
        @update:model-value="updateField('version', $event)"
      />
    </ElFormItem>

    <!-- Cipher Suites -->
    <CipherSuiteEditor
      :model-value="modelValue?.cipherSuites"
      @update:model-value="updateField('cipherSuites', $event)"
    />

    <!-- IKEv2 Transform Types -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.protocolProperties.ikev2TransformTypes')" schemaPath="cryptoProperties.protocolProperties.ikev2TransformTypes" />
      </template>
    </ElFormItem>
    <Ikev2TransformTypesEditor
      :model-value="modelValue?.ikev2TransformTypes"
      @update:model-value="updateField('ikev2TransformTypes', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.protocol-props {
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

  &__select {
    @include element-select;
  }
}

@include element-popper;
</style>
