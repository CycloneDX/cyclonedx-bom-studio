<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import HashForm from '@/components/editors/crypto/HashForm.vue'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const materialTypes = [
  'private-key', 'public-key', 'secret-key', 'key', 'ciphertext',
  'signature', 'digest', 'initialization-vector', 'nonce', 'seed',
  'salt', 'shared-secret', 'tag', 'additional-data', 'password',
  'credential', 'token', 'other', 'unknown'
]

const materialStates = [
  'pre-activation', 'active', 'suspended', 'deactivated', 'compromised', 'destroyed'
]

const updateField = (field: string, value: any) => {
  const updated = { ...(props.modelValue || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete updated[field]
  }
  emit('update:modelValue', updated)
}

const updateSecuredBy = (field: string, value: any) => {
  const securedBy = { ...(props.modelValue?.securedBy || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete securedBy[field]
  }
  const keys = Object.keys(securedBy).filter(k => securedBy[k] !== undefined && securedBy[k] !== '')
  updateField('securedBy', keys.length > 0 ? securedBy : undefined)
}
</script>

<template>
  <div class="rcm-props">
    <!-- Material Type -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.type')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.type" />
      </template>
      <ElSelect
        :model-value="modelValue?.type"
        clearable
        class="rcm-props__select"
        @update:model-value="updateField('type', $event)"
      >
        <ElOption v-for="mt in materialTypes" :key="mt" :label="mt" :value="mt" />
      </ElSelect>
    </ElFormItem>

    <!-- State -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.state')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.state" />
      </template>
      <ElSelect
        :model-value="modelValue?.state"
        clearable
        class="rcm-props__select"
        @update:model-value="updateField('state', $event)"
      >
        <ElOption v-for="s in materialStates" :key="s" :label="s" :value="s" />
      </ElSelect>
    </ElFormItem>

    <!-- ID -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.id')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.id" />
      </template>
      <ElInput
        :model-value="modelValue?.id"
        :placeholder="t('component.cryptoProperties.relatedCryptoMaterialProperties.idPlaceholder')"
        class="rcm-props__input"
        @update:model-value="updateField('id', $event)"
      />
    </ElFormItem>

    <!-- Value -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.value')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.value" />
      </template>
      <ElInput
        :model-value="modelValue?.value"
        type="textarea"
        :rows="2"
        :placeholder="t('component.cryptoProperties.relatedCryptoMaterialProperties.valuePlaceholder')"
        class="rcm-props__input"
        @update:model-value="updateField('value', $event)"
      />
    </ElFormItem>

    <!-- Size (bits) -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.size')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.size" />
      </template>
      <ElInput
        :model-value="modelValue?.size"
        type="number"
        :placeholder="t('component.cryptoProperties.relatedCryptoMaterialProperties.sizePlaceholder')"
        class="rcm-props__input"
        @update:model-value="updateField('size', $event ? Number($event) : undefined)"
      />
    </ElFormItem>

    <!-- Format -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.format')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.format" />
      </template>
      <ElInput
        :model-value="modelValue?.format"
        :placeholder="t('component.cryptoProperties.relatedCryptoMaterialProperties.formatPlaceholder')"
        class="rcm-props__input"
        @update:model-value="updateField('format', $event)"
      />
    </ElFormItem>

    <!-- Creation Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.creationDate')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.creationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.creationDate"
        placeholder="e.g. 2024-01-01T00:00:00Z"
        class="rcm-props__input"
        @update:model-value="updateField('creationDate', $event)"
      />
    </ElFormItem>

    <!-- Activation Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.activationDate')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.activationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.activationDate"
        placeholder="e.g. 2024-01-01T00:00:00Z"
        class="rcm-props__input"
        @update:model-value="updateField('activationDate', $event)"
      />
    </ElFormItem>

    <!-- Update Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.updateDate')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.updateDate" />
      </template>
      <ElInput
        :model-value="modelValue?.updateDate"
        placeholder="e.g. 2024-06-15T12:00:00Z"
        class="rcm-props__input"
        @update:model-value="updateField('updateDate', $event)"
      />
    </ElFormItem>

    <!-- Expiration Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.expirationDate')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.expirationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.expirationDate"
        placeholder="e.g. 2025-12-31T23:59:59Z"
        class="rcm-props__input"
        @update:model-value="updateField('expirationDate', $event)"
      />
    </ElFormItem>

    <!-- Secured By -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.securedByMechanism')" schemaPath="cryptoProperties.relatedCryptoMaterialProperties.securedBy.mechanism" />
      </template>
      <ElInput
        :model-value="modelValue?.securedBy?.mechanism"
        :placeholder="t('component.cryptoProperties.relatedCryptoMaterialProperties.securedByMechanismPlaceholder')"
        class="rcm-props__input"
        @update:model-value="updateSecuredBy('mechanism', $event)"
      />
    </ElFormItem>

    <!-- Fingerprint -->
    <HashForm
      :model-value="modelValue?.fingerprint"
      :label="t('component.cryptoProperties.relatedCryptoMaterialProperties.fingerprint')"
      @update:model-value="updateField('fingerprint', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.rcm-props {
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

    :deep(.el-textarea__inner) {
      background-color: $bg-input;
      color: $text-primary;
    }
  }

  &__select {
    @include element-select;
  }
}

@include element-popper;
</style>
