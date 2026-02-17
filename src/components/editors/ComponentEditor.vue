<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElDivider, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import LicenseChooser from '@/components/shared/LicenseChooser.vue'
import HashEditor from '@/components/shared/HashEditor.vue'
import ExternalReferenceEditor from '@/components/shared/ExternalReferenceEditor.vue'
import PropertyEditor from '@/components/shared/PropertyEditor.vue'
import OrganizationForm from '@/components/shared/OrganizationForm.vue'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import AlgorithmPropertiesEditor from '@/components/editors/crypto/AlgorithmPropertiesEditor.vue'
import CertificatePropertiesEditor from '@/components/editors/crypto/CertificatePropertiesEditor.vue'
import ProtocolPropertiesEditor from '@/components/editors/crypto/ProtocolPropertiesEditor.vue'
import RelatedCryptoMaterialEditor from '@/components/editors/crypto/RelatedCryptoMaterialEditor.vue'
import DataPropertiesEditor from '@/components/editors/data/DataPropertiesEditor.vue'
import { useSpecVersionGating } from '@/composables/useSpecVersionGating'
import { useFormValidation } from '@/composables/useFormValidation'

interface Props {
  visible: boolean
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'save'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { availableComponentTypes } = useSpecVersionGating()

const componentTypes = computed(() =>
  availableComponentTypes.value.map(ct => ({
    label: t(ct.i18nKey),
    value: ct.value
  }))
)

const scopeOptions = [
  { label: t('component.scope.required'), value: 'required' },
  { label: t('component.scope.optional'), value: 'optional' },
  { label: t('component.scope.excluded'), value: 'excluded' }
]

const cryptoAssetTypes = [
  'algorithm', 'certificate', 'protocol', 'related-crypto-material'
]

const cryptoAssetType = computed(() => component.value.cryptoProperties?.assetType)

const component = computed({
  get: () => props.modelValue || {},
  set: (value: any) => {
    emit('update:modelValue', value)
  }
})

const typeGuidance = computed(() => {
  const typeKeyMap: { [key: string]: string } = {
    'operating-system': 'operatingSystem',
    'device-driver': 'deviceDriver',
    'machine-learning-model': 'machineLearningModel',
    'cryptographic-asset': 'cryptographicAsset'
  }
  const key = typeKeyMap[component.value.type] || component.value.type
  return t(`component.typeGuidance.${key}`) || ''
})

const isCryptoAsset = computed(() => component.value.type === 'cryptographic-asset')
const isMLModel = computed(() => component.value.type === 'machine-learning-model')
const isDataType = computed(() => component.value.type === 'data')

const formRef = ref<FormInstance>()

const { noWhitespaceOnly } = useFormValidation()

const formRules: FormRules = {
  name: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { validator: noWhitespaceOnly, trigger: 'blur' }
  ],
  type: [
    { required: true, message: t('validation.required'), trigger: 'change' }
  ]
}

const updateField = (field: string, value: any) => {
  const updated = { ...component.value, [field]: value }
  emit('update:modelValue', updated)
}

const updateCryptoProperty = (field: string, value: any) => {
  const cryptoProperties = { ...(component.value.cryptoProperties || {}), [field]: value }
  // Remove empty objects
  if (value && typeof value === 'object' && Object.keys(value).length === 0) {
    delete cryptoProperties[field]
  }
  updateField('cryptoProperties', cryptoProperties)
}

const updateModelCard = (field: string, value: any) => {
  const modelCard = { ...(component.value.modelCard || {}), [field]: value }
  updateField('modelCard', modelCard)
}

const handleSave = async () => {
  if (!formRef.value) { emit('save'); return }
  try {
    await formRef.value.validate()
    // Trim required fields before saving
    if (typeof component.value.name === 'string') {
      updateField('name', component.value.name.trim())
    }
    emit('save')
  } catch {
    ElMessage.warning(t('validation.fixErrors'))
  }
}

const handleCancel = () => {
  emit('close')
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="t('component.editComponent')"
    width="90%"
    :close-on-click-modal="false"
    @update:model-value="(val) => !val && handleCancel()"
  >
    <div class="component-editor">
      <ElForm ref="formRef" :model="component" :rules="formRules" label-width="160px" class="component-editor__form">
        <!-- Type -->
        <ElFormItem prop="type" required>
          <template #label>
            <TooltipLabel :label="t('component.type')" schemaPath="component.type" />
          </template>
          <ElSelect
            :model-value="component.type"
            class="component-editor__select"
            @update:model-value="updateField('type', $event)"
          >
            <ElOption
              v-for="type in componentTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </ElSelect>
          <p v-if="typeGuidance" class="component-editor__guidance">{{ typeGuidance }}</p>
        </ElFormItem>

        <!-- Name -->
        <ElFormItem prop="name" required>
          <template #label>
            <TooltipLabel :label="t('component.name')" schemaPath="component.name" />
          </template>
          <ElInput
            :model-value="component.name"
            :placeholder="t('component.namePlaceholder')"
            class="component-editor__input"
            @update:model-value="updateField('name', $event)"
          />
        </ElFormItem>

        <!-- Version -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.version')" schemaPath="component.version" />
          </template>
          <ElInput
            :model-value="component.version"
            :placeholder="t('component.versionPlaceholder')"
            class="component-editor__input"
            @update:model-value="updateField('version', $event)"
          />
        </ElFormItem>

        <!-- Group -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.group')" schemaPath="component.group" />
          </template>
          <ElInput
            :model-value="component.group"
            :placeholder="t('component.groupPlaceholder')"
            class="component-editor__input"
            @update:model-value="updateField('group', $event)"
          />
        </ElFormItem>

        <!-- Description -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.description')" schemaPath="component.description" />
          </template>
          <ElInput
            :model-value="component.description"
            type="textarea"
            :rows="3"
            :placeholder="t('component.descriptionPlaceholder')"
            class="component-editor__input"
            @update:model-value="updateField('description', $event)"
          />
        </ElFormItem>

        <!-- PURL -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.purl')" schemaPath="component.purl" />
          </template>
          <ElInput
            :model-value="component.purl"
            :placeholder="t('component.purlPlaceholder')"
            class="component-editor__input"
            @update:model-value="updateField('purl', $event)"
          />
        </ElFormItem>

        <!-- CPE -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.cpe')" schemaPath="component.cpe" />
          </template>
          <ElInput
            :model-value="component.cpe"
            :placeholder="t('component.cpePlaceholder')"
            class="component-editor__input"
            @update:model-value="updateField('cpe', $event)"
          />
        </ElFormItem>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- CRYPTO PROPERTIES (cryptographic-asset type) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <template v-if="isCryptoAsset">
          <ElDivider>{{ t('component.cryptoProperties.title') }}</ElDivider>

          <!-- Asset Type -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.cryptoProperties.assetType')" schemaPath="cryptoProperties.assetType" />
            </template>
            <ElSelect
              :model-value="component.cryptoProperties?.assetType"
              class="component-editor__select"
              @update:model-value="updateCryptoProperty('assetType', $event)"
            >
              <ElOption
                v-for="at in cryptoAssetTypes"
                :key="at"
                :label="at"
                :value="at"
              />
            </ElSelect>
          </ElFormItem>

          <!-- OID (shared across all asset types) -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.cryptoProperties.oid')" schemaPath="cryptoProperties.oid" />
            </template>
            <ElInput
              :model-value="component.cryptoProperties?.oid"
              placeholder="e.g. 2.16.840.1.101.3.4.2.1"
              class="component-editor__input"
              @update:model-value="updateCryptoProperty('oid', $event)"
            />
          </ElFormItem>

          <!-- Algorithm Properties -->
          <template v-if="cryptoAssetType === 'algorithm'">
            <ElDivider content-position="left">{{ t('component.cryptoProperties.algorithmProperties.title') }}</ElDivider>
            <AlgorithmPropertiesEditor
              :model-value="component.cryptoProperties?.algorithmProperties"
              @update:model-value="updateCryptoProperty('algorithmProperties', $event)"
            />
          </template>

          <!-- Certificate Properties -->
          <template v-if="cryptoAssetType === 'certificate'">
            <ElDivider content-position="left">{{ t('component.cryptoProperties.certificateProperties.title') }}</ElDivider>
            <CertificatePropertiesEditor
              :model-value="component.cryptoProperties?.certificateProperties"
              @update:model-value="updateCryptoProperty('certificateProperties', $event)"
            />
          </template>

          <!-- Protocol Properties -->
          <template v-if="cryptoAssetType === 'protocol'">
            <ElDivider content-position="left">{{ t('component.cryptoProperties.protocolProperties.title') }}</ElDivider>
            <ProtocolPropertiesEditor
              :model-value="component.cryptoProperties?.protocolProperties"
              @update:model-value="updateCryptoProperty('protocolProperties', $event)"
            />
          </template>

          <!-- Related Crypto Material Properties -->
          <template v-if="cryptoAssetType === 'related-crypto-material'">
            <ElDivider content-position="left">{{ t('component.cryptoProperties.relatedCryptoMaterialProperties.title') }}</ElDivider>
            <RelatedCryptoMaterialEditor
              :model-value="component.cryptoProperties?.relatedCryptoMaterialProperties"
              @update:model-value="updateCryptoProperty('relatedCryptoMaterialProperties', $event)"
            />
          </template>
        </template>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- MODEL CARD (machine-learning-model type) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <template v-if="isMLModel">
          <ElDivider>{{ t('component.modelCard.title') }}</ElDivider>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.modelCard.modelArchitecture')" schemaPath="modelCard.modelArchitecture" />
            </template>
            <ElInput
              :model-value="component.modelCard?.modelArchitecture"
              :placeholder="t('component.modelCard.architecturePlaceholder')"
              class="component-editor__input"
              @update:model-value="updateModelCard('modelArchitecture', $event)"
            />
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.modelCard.datasets')" schemaPath="modelCard.datasets" />
            </template>
            <ElInput
              :model-value="component.modelCard?.datasets"
              type="textarea"
              :rows="2"
              :placeholder="t('component.modelCard.datasetsPlaceholder')"
              class="component-editor__input"
              @update:model-value="updateModelCard('datasets', $event)"
            />
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.modelCard.ethicalConsiderations')" schemaPath="modelCard.ethicalConsiderations" />
            </template>
            <ElInput
              :model-value="component.modelCard?.ethicalConsiderations"
              type="textarea"
              :rows="3"
              :placeholder="t('component.modelCard.ethicalPlaceholder')"
              class="component-editor__input"
              @update:model-value="updateModelCard('ethicalConsiderations', $event)"
            />
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.modelCard.quantitativeAnalysis')" schemaPath="modelCard.quantitativeAnalysis" />
            </template>
            <ElInput
              :model-value="component.modelCard?.quantitativeAnalysis"
              type="textarea"
              :rows="3"
              :placeholder="t('component.modelCard.quantitativePlaceholder')"
              class="component-editor__input"
              @update:model-value="updateModelCard('quantitativeAnalysis', $event)"
            />
          </ElFormItem>
        </template>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- DATA SECTION (data type) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <template v-if="isDataType">
          <ElDivider>{{ t('component.dataSection.title') }}</ElDivider>
          <DataPropertiesEditor
            :model-value="component.data"
            @update:model-value="updateField('data', $event)"
          />
        </template>

        <!-- Additional Fields -->
          <ElDivider />

          <!-- BOM Ref -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.bomRef')" schemaPath="component.bom-ref" />
            </template>
            <ElInput
              :model-value="component['bom-ref']"
              readonly
              class="component-editor__input"
            />
          </ElFormItem>

          <!-- MIME Type -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.mimeType')" schemaPath="component.mime-type" />
            </template>
            <ElInput
              :model-value="component.mimeType"
              :placeholder="t('component.mimeTypePlaceholder')"
              class="component-editor__input"
              @update:model-value="updateField('mimeType', $event)"
            />
          </ElFormItem>

          <!-- Publisher -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.publisher')" schemaPath="component.publisher" />
            </template>
            <ElInput
              :model-value="component.publisher"
              :placeholder="t('component.publisherPlaceholder')"
              class="component-editor__input"
              @update:model-value="updateField('publisher', $event)"
            />
          </ElFormItem>

          <!-- Scope -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.scope')" schemaPath="component.scope" />
            </template>
            <ElSelect
              :model-value="component.scope"
              class="component-editor__select"
              @update:model-value="updateField('scope', $event)"
            >
              <ElOption
                v-for="scope in scopeOptions"
                :key="scope.value"
                :label="scope.label"
                :value="scope.value"
              />
            </ElSelect>
          </ElFormItem>

          <!-- Copyright -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.copyright')" schemaPath="component.copyright" />
            </template>
            <ElInput
              :model-value="component.copyright"
              type="textarea"
              :rows="2"
              :placeholder="t('component.copyrightPlaceholder')"
              class="component-editor__input"
              @update:model-value="updateField('copyright', $event)"
            />
          </ElFormItem>

          <!-- Supplier -->
          <ElDivider />
          <OrganizationForm
            :model-value="component.supplier"
            :label="t('component.supplier')"
            @update:model-value="updateField('supplier', $event)"
          />

          <!-- Licenses -->
          <ElDivider />
          <LicenseChooser
            :model-value="component.licenses"
            @update:model-value="updateField('licenses', $event)"
          />

          <!-- Hashes -->
          <ElDivider />
          <HashEditor
            :model-value="component.hashes"
            @update:model-value="updateField('hashes', $event)"
          />

          <!-- External References -->
          <ElDivider />
          <ExternalReferenceEditor
            :model-value="component.externalReferences"
            @update:model-value="updateField('externalReferences', $event)"
          />

          <!-- Properties -->
          <ElDivider />
          <PropertyEditor
            :model-value="component.properties"
            @update:model-value="updateField('properties', $event)"
          />

      </ElForm>

      <p class="component-editor__info">{{ t('component.editorInfo') }}</p>
    </div>

    <template #footer>
      <div class="component-editor__footer">
        <ElButton @click="handleCancel">
          {{ t('common.cancel') }}
        </ElButton>
        <ElButton
          type="primary"
          @click="handleSave"
        >
          {{ t('common.save') }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.component-editor {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  max-height: 70vh;
  overflow-y: auto;

  &__form {
    :deep(.el-form-item__label) {
      color: $text-secondary;
      font-weight: $weight-medium;
    }

    :deep(.el-form-item) {
      margin-bottom: $space-4;
    }

    :deep(.el-divider__text) {
      color: $accent-primary;
      font-weight: $weight-semibold;
      font-size: $text-sm;
      background-color: $bg-surface;
    }
  }

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

  &__guidance {
    font-size: $text-xs;
    color: $text-secondary;
    margin: $space-2 0 0 0;
    font-style: italic;
  }

  &__info {
    font-size: $text-xs;
    color: $text-secondary;
    margin: 0;
    padding: $space-3;
    background-color: rgba($accent-primary, 0.04);
    border-left: 2px solid $accent-primary;
    border-radius: 0 $radius-sm $radius-sm 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
  }
}
</style>
