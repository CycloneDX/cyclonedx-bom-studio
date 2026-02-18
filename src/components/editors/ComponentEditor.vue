<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect, ElOption, ElButton, ElDivider, ElSwitch, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import LicenseChooser from '@/components/shared/LicenseChooser.vue'
import HashEditor from '@/components/shared/HashEditor.vue'
import ExternalReferenceEditor from '@/components/shared/ExternalReferenceEditor.vue'
import PropertyEditor from '@/components/shared/PropertyEditor.vue'
import OrganizationForm from '@/components/shared/OrganizationForm.vue'
import ContactForm from '@/components/shared/ContactForm.vue'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import AddButton from '@/components/shared/AddButton.vue'
import TagInput from '@/components/shared/TagInput.vue'
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

// Version and versionRange are mutually exclusive.
// Whichever field has a value disables and clears the other.
const hasVersion = computed(() => !!component.value.version)
const hasVersionRange = computed(() => !!component.value.versionRange)

const updateVersion = (value: any) => {
  const updated = { ...component.value }
  if (value) {
    updated.version = value
    delete updated.versionRange
  } else {
    delete updated.version
  }
  emit('update:modelValue', updated)
}

const updateVersionRange = (value: any) => {
  const updated = { ...component.value }
  if (value) {
    updated.versionRange = value
    delete updated.version
  } else {
    delete updated.versionRange
  }
  emit('update:modelValue', updated)
}

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
  const updated = { ...component.value }
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    delete updated[field]
  } else {
    updated[field] = value
  }
  emit('update:modelValue', updated)
}

const updateCryptoProperty = (field: string, value: any) => {
  const cryptoProperties = { ...(component.value.cryptoProperties || {}), [field]: value }
  if (value && typeof value === 'object' && Object.keys(value).length === 0) {
    delete cryptoProperties[field]
  }
  updateField('cryptoProperties', cryptoProperties)
}

const updateModelCard = (field: string, value: any) => {
  const modelCard = { ...(component.value.modelCard || {}), [field]: value }
  updateField('modelCard', modelCard)
}

const updateSwid = (field: string, value: any) => {
  const swid = { ...(component.value.swid || {}) }
  if (value === undefined || value === null || value === '') {
    delete swid[field]
  } else {
    swid[field] = value
  }
  // Remove swid entirely if only empty
  if (Object.keys(swid).length === 0) {
    updateField('swid', undefined)
  } else {
    updateField('swid', swid)
  }
}

// Authors management
const addAuthor = () => {
  const authors = [...(component.value.authors || []), { name: '' }]
  updateField('authors', authors)
}

const removeAuthor = (index: number) => {
  const authors = [...(component.value.authors || [])]
  authors.splice(index, 1)
  updateField('authors', authors.length > 0 ? authors : undefined)
}

const updateAuthor = (index: number, value: any) => {
  const authors = [...(component.value.authors || [])]
  authors[index] = value
  updateField('authors', authors)
}

// OmniBOR ID management (string array)
const addOmniborId = () => {
  const ids = [...(component.value.omniborId || []), '']
  updateField('omniborId', ids)
}

const removeOmniborId = (index: number) => {
  const ids = [...(component.value.omniborId || [])]
  ids.splice(index, 1)
  updateField('omniborId', ids.length > 0 ? ids : undefined)
}

const updateOmniborId = (index: number, value: string) => {
  const ids = [...(component.value.omniborId || [])]
  ids[index] = value
  updateField('omniborId', ids)
}

// SWHID management (string array)
const addSwhid = () => {
  const ids = [...(component.value.swhid || []), '']
  updateField('swhid', ids)
}

const removeSwhid = (index: number) => {
  const ids = [...(component.value.swhid || [])]
  ids.splice(index, 1)
  updateField('swhid', ids.length > 0 ? ids : undefined)
}

const updateSwhid = (index: number, value: string) => {
  const ids = [...(component.value.swhid || [])]
  ids[index] = value
  updateField('swhid', ids)
}

const handleSave = async () => {
  if (!formRef.value) { emit('save'); return }
  try {
    await formRef.value.validate()
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

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- BASIC INFO -->
        <!-- ═══════════════════════════════════════════════════════ -->

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

        <!-- Version / Version Range (mutually exclusive) -->
        <div class="component-editor__version-group">
          <ElFormItem class="component-editor__version-field">
            <template #label>
              <TooltipLabel :label="t('component.version')" schemaPath="component.version" />
            </template>
            <ElInput
              :model-value="component.version"
              :placeholder="t('component.versionPlaceholder')"
              :disabled="hasVersionRange"
              class="component-editor__input"
              @update:model-value="updateVersion($event)"
            />
          </ElFormItem>
          <span class="component-editor__version-or">{{ t('component.versionOr') }}</span>
          <ElFormItem class="component-editor__version-field">
            <template #label>
              <TooltipLabel :label="t('component.versionRange')" schemaPath="component.versionRange" />
            </template>
            <ElInput
              :model-value="component.versionRange"
              :placeholder="t('component.versionRangePlaceholder')"
              :disabled="hasVersion"
              class="component-editor__input"
              @update:model-value="updateVersionRange($event)"
            />
          </ElFormItem>
        </div>

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

        <!-- Scope -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.scopeLabel')" schemaPath="component.scope" />
          </template>
          <ElSelect
            :model-value="component.scope"
            clearable
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

        <!-- External Component + Version Range -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.isExternal')" schemaPath="component.isExternal" />
          </template>
          <ElSwitch
            :model-value="component.isExternal || false"
            @update:model-value="updateField('isExternal', $event || undefined)"
          />
        </ElFormItem>

        <!-- Tags -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.tags')" schemaPath="component.tags" />
          </template>
          <TagInput
            :model-value="component.tags || []"
            :placeholder="t('component.tagsPlaceholder')"
            @update:model-value="updateField('tags', $event.length > 0 ? $event : undefined)"
          />
        </ElFormItem>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- COMPONENT IDENTITY -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.identity') }}</ElDivider>

        <!-- PURL -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.purl')" schemaPath="component.purl" />
          </template>
          <ElInput
            :model-value="component.purl"
            :placeholder="t('component.purlPlaceholder')"
            class="component-editor__input component-editor__mono"
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
            class="component-editor__input component-editor__mono"
            @update:model-value="updateField('cpe', $event)"
          />
        </ElFormItem>

        <!-- OmniBOR Artifact IDs -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.omniborId')" schemaPath="component.omniborId" />
          </template>
          <div class="component-editor__list-field">
            <div v-for="(id, index) in (component.omniborId || [])" :key="'omnibor-' + index" class="component-editor__list-row">
              <ElInput
                :model-value="id"
                :placeholder="t('component.omniborIdPlaceholder')"
                class="component-editor__input component-editor__mono"
                @update:model-value="updateOmniborId(Number(index), $event)"
              />
              <ElButton type="danger" plain size="small" @click="removeOmniborId(Number(index))">
                {{ t('common.delete') }}
              </ElButton>
            </div>
            <AddButton size="small" @click="addOmniborId" />
          </div>
        </ElFormItem>

        <!-- SWHIDs -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.swhid')" schemaPath="component.swhid" />
          </template>
          <div class="component-editor__list-field">
            <div v-for="(id, index) in (component.swhid || [])" :key="'swhid-' + index" class="component-editor__list-row">
              <ElInput
                :model-value="id"
                :placeholder="t('component.swhidPlaceholder')"
                class="component-editor__input component-editor__mono"
                @update:model-value="updateSwhid(Number(index), $event)"
              />
              <ElButton type="danger" plain size="small" @click="removeSwhid(Number(index))">
                {{ t('common.delete') }}
              </ElButton>
            </div>
            <AddButton size="small" @click="addSwhid" />
          </div>
        </ElFormItem>

        <!-- SWID Tag -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('component.swid')" schemaPath="component.swid" />
          </template>
          <div class="component-editor__swid-form">
            <div class="component-editor__swid-row">
              <ElFormItem :label="t('component.swidTagId')">
                <ElInput
                  :model-value="component.swid?.tagId"
                  :placeholder="t('component.swidTagIdPlaceholder')"
                  class="component-editor__input component-editor__mono"
                  @update:model-value="updateSwid('tagId', $event)"
                />
              </ElFormItem>
              <ElFormItem :label="t('component.swidName')">
                <ElInput
                  :model-value="component.swid?.name"
                  :placeholder="t('component.swidNamePlaceholder')"
                  class="component-editor__input"
                  @update:model-value="updateSwid('name', $event)"
                />
              </ElFormItem>
            </div>
            <div class="component-editor__swid-row">
              <ElFormItem :label="t('component.swidVersion')">
                <ElInput
                  :model-value="component.swid?.version"
                  :placeholder="t('component.swidVersionPlaceholder')"
                  class="component-editor__input"
                  @update:model-value="updateSwid('version', $event)"
                />
              </ElFormItem>
              <ElFormItem :label="t('component.swidTagVersion')">
                <ElInputNumber
                  :model-value="component.swid?.tagVersion"
                  :min="0"
                  controls-position="right"
                  @update:model-value="updateSwid('tagVersion', $event)"
                />
              </ElFormItem>
              <ElFormItem :label="t('component.swidPatch')">
                <ElSwitch
                  :model-value="component.swid?.patch || false"
                  @update:model-value="updateSwid('patch', $event || undefined)"
                />
              </ElFormItem>
            </div>
            <ElFormItem :label="t('component.swidUrl')">
              <ElInput
                :model-value="component.swid?.url"
                :placeholder="t('component.swidUrlPlaceholder')"
                class="component-editor__input component-editor__mono"
                @update:model-value="updateSwid('url', $event)"
              />
            </ElFormItem>
          </div>
        </ElFormItem>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- AUTHORS -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.authors') }}</ElDivider>

        <div v-for="(author, index) in (component.authors || [])" :key="'author-' + index">
          <ContactForm
            :model-value="author"
            @update:model-value="updateAuthor(Number(index), $event)"
            @remove="removeAuthor(Number(index))"
          />
        </div>
        <AddButton size="small" @click="addAuthor" />

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- SUPPLIER -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.supplier') }}</ElDivider>
        <OrganizationForm
          :model-value="component.supplier"
          :label="t('component.supplier')"
          @update:model-value="updateField('supplier', $event)"
        />

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- MANUFACTURER -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.manufacturer') }}</ElDivider>
        <OrganizationForm
          :model-value="component.manufacturer"
          :label="t('component.manufacturer')"
          @update:model-value="updateField('manufacturer', $event)"
        />

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- LICENSES -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.licenses') }}</ElDivider>
        <LicenseChooser
          :model-value="component.licenses"
          @update:model-value="updateField('licenses', $event)"
        />

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- HASHES -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.hashes') }}</ElDivider>
        <HashEditor
          :model-value="component.hashes"
          @update:model-value="updateField('hashes', $event)"
        />

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- EXTERNAL REFERENCES -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.externalReferences') }}</ElDivider>
        <ExternalReferenceEditor
          :model-value="component.externalReferences"
          @update:model-value="updateField('externalReferences', $event)"
        />

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- PROPERTIES -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <ElDivider>{{ t('component.properties') }}</ElDivider>
        <PropertyEditor
          :model-value="component.properties"
          @update:model-value="updateField('properties', $event)"
        />

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

          <!-- OID -->
          <ElFormItem>
            <template #label>
              <TooltipLabel :label="t('component.cryptoProperties.oid')" schemaPath="cryptoProperties.oid" />
            </template>
            <ElInput
              :model-value="component.cryptoProperties?.oid"
              placeholder="e.g. 2.16.840.1.101.3.4.2.1"
              class="component-editor__input component-editor__mono"
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

  &__mono {
    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      font-family: $font-mono;
      font-size: $text-sm;
    }
  }

  &__guidance {
    font-size: $text-xs;
    color: $text-secondary;
    margin: $space-2 0 0 0;
    font-style: italic;
  }

  &__list-field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    width: 100%;
    align-items: flex-start;
  }

  &__list-row {
    display: flex;
    gap: $space-2;
    align-items: center;
    align-self: stretch;
  }

  &__version-group {
    display: flex;
    align-items: flex-end;
    gap: $space-3;
    width: 100%;
    margin-bottom: $space-4;
  }

  &__version-field {
    flex: 1;
    margin-bottom: 0 !important;
  }

  &__version-or {
    color: $text-tertiary;
    font-size: $text-xs;
    font-weight: $weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: $space-2;
    flex-shrink: 0;
  }

  &__swid-form {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    width: 100%;
    padding: $space-3;
    background-color: rgba($accent-primary, 0.03);
    border: 1px solid $border-subtle;
    border-radius: $radius-md;

    :deep(.el-form-item) {
      margin-bottom: $space-2;
    }
  }

  &__swid-row {
    display: flex;
    gap: $space-4;

    > * {
      flex: 1;
    }
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
