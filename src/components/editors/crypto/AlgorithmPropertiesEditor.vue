<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElSelect, ElOption, ElInput } from 'element-plus'
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

const primitives = [
  'drbg', 'mac', 'block-cipher', 'stream-cipher', 'signature',
  'hash', 'pke', 'xof', 'kdf', 'key-agree', 'kem', 'ae',
  'combiner', 'key-wrap', 'other', 'unknown'
]

const executionEnvironments = [
  'software-plain-ram', 'software-encrypted-ram', 'software-tee',
  'hardware', 'other', 'unknown'
]

const implementationPlatforms = [
  'generic', 'x86_32', 'x86_64', 'armv7-a', 'armv7-m',
  'armv8-a', 'armv8-m', 'armv9-a', 'armv9-m',
  's390x', 'ppc64', 'ppc64le', 'other', 'unknown'
]

const certificationLevels = [
  'none',
  'fips140-1-l1', 'fips140-1-l2', 'fips140-1-l3', 'fips140-1-l4',
  'fips140-2-l1', 'fips140-2-l2', 'fips140-2-l3', 'fips140-2-l4',
  'fips140-3-l1', 'fips140-3-l2', 'fips140-3-l3', 'fips140-3-l4',
  'cc-eal1', 'cc-eal1+', 'cc-eal2', 'cc-eal2+',
  'cc-eal3', 'cc-eal3+', 'cc-eal4', 'cc-eal4+',
  'cc-eal5', 'cc-eal5+', 'cc-eal6', 'cc-eal6+',
  'cc-eal7', 'cc-eal7+', 'other', 'unknown'
]

const modes = ['cbc', 'ecb', 'ccm', 'gcm', 'cfb', 'ofb', 'ctr', 'other', 'unknown']

const paddings = ['pkcs5', 'pkcs7', 'pkcs1v15', 'oaep', 'raw', 'other', 'unknown']

const cryptoFunctionOptions = [
  'generate', 'keygen', 'encrypt', 'decrypt', 'digest', 'tag',
  'keyderive', 'sign', 'verify', 'encapsulate', 'decapsulate', 'other', 'unknown'
]

const updateField = (field: string, value: any) => {
  const updated = { ...(props.modelValue || {}), [field]: value }
  if (value === '' || value === null || value === undefined) {
    delete updated[field]
  }
  // Remove empty arrays
  if (Array.isArray(value) && value.length === 0) {
    delete updated[field]
  }
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="algorithm-props">
    <!-- Primitive -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.primitive')" schemaPath="cryptoProperties.algorithmProperties.primitive" />
      </template>
      <ElSelect
        :model-value="modelValue?.primitive"
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('primitive', $event)"
      >
        <ElOption v-for="p in primitives" :key="p" :label="p" :value="p" />
      </ElSelect>
    </ElFormItem>

    <!-- Algorithm Family -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.algorithmFamily')" schemaPath="cryptoProperties.algorithmProperties.algorithmFamily" />
      </template>
      <ElInput
        :model-value="modelValue?.algorithmFamily"
        :placeholder="t('component.cryptoProperties.algorithmProperties.algorithmFamilyPlaceholder')"
        class="algorithm-props__input"
        @update:model-value="updateField('algorithmFamily', $event)"
      />
    </ElFormItem>

    <!-- Parameter Set Identifier -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.parameterSetIdentifier')" schemaPath="cryptoProperties.algorithmProperties.parameterSetIdentifier" />
      </template>
      <ElInput
        :model-value="modelValue?.parameterSetIdentifier"
        :placeholder="t('component.cryptoProperties.algorithmProperties.parameterSetPlaceholder')"
        class="algorithm-props__input"
        @update:model-value="updateField('parameterSetIdentifier', $event)"
      />
    </ElFormItem>

    <!-- Elliptic Curve -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.ellipticCurve')" schemaPath="cryptoProperties.algorithmProperties.ellipticCurve" />
      </template>
      <ElInput
        :model-value="modelValue?.ellipticCurve"
        :placeholder="t('component.cryptoProperties.algorithmProperties.ellipticCurvePlaceholder')"
        class="algorithm-props__input"
        @update:model-value="updateField('ellipticCurve', $event)"
      />
    </ElFormItem>

    <!-- Execution Environment -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.executionEnvironment')" schemaPath="cryptoProperties.algorithmProperties.executionEnvironment" />
      </template>
      <ElSelect
        :model-value="modelValue?.executionEnvironment"
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('executionEnvironment', $event)"
      >
        <ElOption v-for="env in executionEnvironments" :key="env" :label="env" :value="env" />
      </ElSelect>
    </ElFormItem>

    <!-- Implementation Platform -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.implementationPlatform')" schemaPath="cryptoProperties.algorithmProperties.implementationPlatform" />
      </template>
      <ElSelect
        :model-value="modelValue?.implementationPlatform"
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('implementationPlatform', $event)"
      >
        <ElOption v-for="p in implementationPlatforms" :key="p" :label="p" :value="p" />
      </ElSelect>
    </ElFormItem>

    <!-- Certification Level -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.certificationLevel')" schemaPath="cryptoProperties.algorithmProperties.certificationLevel" />
      </template>
      <ElSelect
        :model-value="modelValue?.certificationLevel || []"
        multiple
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('certificationLevel', $event)"
      >
        <ElOption v-for="cl in certificationLevels" :key="cl" :label="cl" :value="cl" />
      </ElSelect>
    </ElFormItem>

    <!-- Mode -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.mode')" schemaPath="cryptoProperties.algorithmProperties.mode" />
      </template>
      <ElSelect
        :model-value="modelValue?.mode"
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('mode', $event)"
      >
        <ElOption v-for="m in modes" :key="m" :label="m" :value="m" />
      </ElSelect>
    </ElFormItem>

    <!-- Padding -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.padding')" schemaPath="cryptoProperties.algorithmProperties.padding" />
      </template>
      <ElSelect
        :model-value="modelValue?.padding"
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('padding', $event)"
      >
        <ElOption v-for="p in paddings" :key="p" :label="p" :value="p" />
      </ElSelect>
    </ElFormItem>

    <!-- Crypto Functions -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.cryptoFunctions')" schemaPath="cryptoProperties.algorithmProperties.cryptoFunctions" />
      </template>
      <ElSelect
        :model-value="modelValue?.cryptoFunctions || []"
        multiple
        clearable
        class="algorithm-props__select"
        @update:model-value="updateField('cryptoFunctions', $event)"
      >
        <ElOption v-for="f in cryptoFunctionOptions" :key="f" :label="f" :value="f" />
      </ElSelect>
    </ElFormItem>

    <!-- Classical Security Level -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.classicalSecurityLevel')" schemaPath="cryptoProperties.algorithmProperties.classicalSecurityLevel" />
      </template>
      <ElInput
        :model-value="modelValue?.classicalSecurityLevel"
        type="number"
        :placeholder="t('component.cryptoProperties.algorithmProperties.securityLevelPlaceholder')"
        class="algorithm-props__input"
        @update:model-value="updateField('classicalSecurityLevel', $event ? Number($event) : undefined)"
      />
    </ElFormItem>

    <!-- NIST Quantum Security Level -->
    <ElFormItem>
      <template #label>
        <TooltipLabel :label="t('component.cryptoProperties.algorithmProperties.nistQuantumSecurityLevel')" schemaPath="cryptoProperties.algorithmProperties.nistQuantumSecurityLevel" />
      </template>
      <ElInput
        :model-value="modelValue?.nistQuantumSecurityLevel"
        type="number"
        min="0"
        max="6"
        :placeholder="t('component.cryptoProperties.algorithmProperties.nistQuantumPlaceholder')"
        class="algorithm-props__input"
        @update:model-value="updateField('nistQuantumSecurityLevel', $event ? Number($event) : undefined)"
      />
    </ElFormItem>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.algorithm-props {
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
