<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElInput } from 'element-plus'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import HashForm from '@/components/editors/crypto/HashForm.vue'
import CertificateStateEditor from '@/components/editors/crypto/CertificateStateEditor.vue'
import CertificateExtensionsEditor from '@/components/editors/crypto/CertificateExtensionsEditor.vue'

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
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="certificate-props">
    <!-- Subject Name -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.subjectName')" schemaPath="cryptoProperties.certificateProperties.subjectName" />
      </template>
      <ElInput
        :model-value="modelValue?.subjectName"
        :placeholder="t('component.cryptoProperties.certificateProperties.subjectNamePlaceholder')"
        class="certificate-props__input"
        @update:model-value="updateField('subjectName', $event)"
      />
    </ElFormItem>

    <!-- Issuer Name -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.issuerName')" schemaPath="cryptoProperties.certificateProperties.issuerName" />
      </template>
      <ElInput
        :model-value="modelValue?.issuerName"
        :placeholder="t('component.cryptoProperties.certificateProperties.issuerNamePlaceholder')"
        class="certificate-props__input"
        @update:model-value="updateField('issuerName', $event)"
      />
    </ElFormItem>

    <!-- Serial Number -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.serialNumber')" schemaPath="cryptoProperties.certificateProperties.serialNumber" />
      </template>
      <ElInput
        :model-value="modelValue?.serialNumber"
        :placeholder="t('component.cryptoProperties.certificateProperties.serialNumberPlaceholder')"
        class="certificate-props__input"
        @update:model-value="updateField('serialNumber', $event)"
      />
    </ElFormItem>

    <!-- Certificate Format -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.certificateFormat')" schemaPath="cryptoProperties.certificateProperties.certificateFormat" />
      </template>
      <ElInput
        :model-value="modelValue?.certificateFormat"
        :placeholder="t('component.cryptoProperties.certificateProperties.certificateFormatPlaceholder')"
        class="certificate-props__input"
        @update:model-value="updateField('certificateFormat', $event)"
      />
    </ElFormItem>

    <!-- Certificate File Extension -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.certificateFileExtension')" schemaPath="cryptoProperties.certificateProperties.certificateFileExtension" />
      </template>
      <ElInput
        :model-value="modelValue?.certificateFileExtension"
        :placeholder="t('component.cryptoProperties.certificateProperties.fileExtensionPlaceholder')"
        class="certificate-props__input"
        @update:model-value="updateField('certificateFileExtension', $event)"
      />
    </ElFormItem>

    <!-- Not Valid Before -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.notValidBefore')" schemaPath="cryptoProperties.certificateProperties.notValidBefore" />
      </template>
      <ElInput
        :model-value="modelValue?.notValidBefore"
        placeholder="e.g. 2024-01-01T00:00:00Z"
        class="certificate-props__input"
        @update:model-value="updateField('notValidBefore', $event)"
      />
    </ElFormItem>

    <!-- Not Valid After -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.notValidAfter')" schemaPath="cryptoProperties.certificateProperties.notValidAfter" />
      </template>
      <ElInput
        :model-value="modelValue?.notValidAfter"
        placeholder="e.g. 2025-12-31T23:59:59Z"
        class="certificate-props__input"
        @update:model-value="updateField('notValidAfter', $event)"
      />
    </ElFormItem>

    <!-- Creation Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.creationDate')" schemaPath="cryptoProperties.certificateProperties.creationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.creationDate"
        placeholder="e.g. 2024-01-01T00:00:00Z"
        class="certificate-props__input"
        @update:model-value="updateField('creationDate', $event)"
      />
    </ElFormItem>

    <!-- Activation Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.activationDate')" schemaPath="cryptoProperties.certificateProperties.activationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.activationDate"
        placeholder="e.g. 2024-01-01T00:00:00Z"
        class="certificate-props__input"
        @update:model-value="updateField('activationDate', $event)"
      />
    </ElFormItem>

    <!-- Deactivation Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.deactivationDate')" schemaPath="cryptoProperties.certificateProperties.deactivationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.deactivationDate"
        placeholder="e.g. 2025-12-31T23:59:59Z"
        class="certificate-props__input"
        @update:model-value="updateField('deactivationDate', $event)"
      />
    </ElFormItem>

    <!-- Revocation Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.revocationDate')" schemaPath="cryptoProperties.certificateProperties.revocationDate" />
      </template>
      <ElInput
        :model-value="modelValue?.revocationDate"
        placeholder="e.g. 2025-06-15T12:00:00Z"
        class="certificate-props__input"
        @update:model-value="updateField('revocationDate', $event)"
      />
    </ElFormItem>

    <!-- Destruction Date -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.certificateProperties.destructionDate')" schemaPath="cryptoProperties.certificateProperties.destructionDate" />
      </template>
      <ElInput
        :model-value="modelValue?.destructionDate"
        placeholder="e.g. 2026-01-01T00:00:00Z"
        class="certificate-props__input"
        @update:model-value="updateField('destructionDate', $event)"
      />
    </ElFormItem>

    <!-- Fingerprint -->
    <HashForm
      :model-value="modelValue?.fingerprint"
      :label="t('component.cryptoProperties.certificateProperties.fingerprint')"
      @update:model-value="updateField('fingerprint', $event)"
    />

    <!-- Certificate State -->
    <CertificateStateEditor
      :model-value="modelValue?.certificateState"
      @update:model-value="updateField('certificateState', $event)"
    />

    <!-- Certificate Extensions -->
    <CertificateExtensionsEditor
      :model-value="modelValue?.certificateExtensions"
      @update:model-value="updateField('certificateExtensions', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.certificate-props {
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
