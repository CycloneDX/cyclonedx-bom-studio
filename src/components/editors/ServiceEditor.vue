<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElDivider, ElIcon, ElSwitch, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import OrganizationForm from '@/components/shared/OrganizationForm.vue'
import { useFormValidation } from '@/composables/useFormValidation'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'

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

const service = computed({
  get: () => props.modelValue || {},
  set: (value: any) => {
    emit('update:modelValue', value)
  }
})

const formRef = ref<FormInstance>()

const { noWhitespaceOnly } = useFormValidation()

const formRules: FormRules = {
  name: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { validator: noWhitespaceOnly, trigger: 'blur' }
  ]
}

const updateField = (field: string, value: any) => {
  const updated = { ...service.value, [field]: value }
  emit('update:modelValue', updated)
}

const addEndpoint = () => {
  const endpoints = service.value.endpoints || []
  const updated = {
    ...service.value,
    endpoints: [...endpoints, '']
  }
  emit('update:modelValue', updated)
}

const updateEndpoint = (index: number, value: string) => {
  const endpoints = service.value.endpoints || []
  endpoints[index] = value
  const updated = {
    ...service.value,
    endpoints: [...endpoints]
  }
  emit('update:modelValue', updated)
}

const removeEndpoint = (index: number) => {
  const endpoints = service.value.endpoints || []
  endpoints.splice(index, 1)
  const updated = {
    ...service.value,
    endpoints: [...endpoints]
  }
  emit('update:modelValue', updated)
}

const updateProvider = (provider: any) => {
  const updated = {
    ...service.value,
    provider
  }
  emit('update:modelValue', updated)
}

const handleSave = async () => {
  if (!formRef.value) { emit('save'); return }
  try {
    await formRef.value.validate()
    if (typeof service.value.name === 'string') {
      updateField('name', service.value.name.trim())
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
    :title="t('service.editService')"
    width="90%"
    :close-on-click-modal="false"
    @update:model-value="(val) => !val && handleCancel()"
  >
    <div class="service-editor">
      <ElForm ref="formRef" :model="service" :rules="formRules" label-width="140px" class="service-editor__form">
        <!-- Basic Mode Fields -->

        <!-- Name -->
        <ElFormItem prop="name" required>
          <template #label>
            <TooltipLabel :label="t('service.name')" schemaPath="service.name" />
          </template>
          <ElInput
            :model-value="service.name"
            :placeholder="t('service.namePlaceholder')"
            class="service-editor__input"
            @update:model-value="updateField('name', $event)"
          />
        </ElFormItem>

        <!-- Description -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.description')" schemaPath="service.description" />
          </template>
          <ElInput
            :model-value="service.description"
            type="textarea"
            :rows="3"
            :placeholder="t('service.descriptionPlaceholder')"
            class="service-editor__input"
            @update:model-value="updateField('description', $event)"
          />
        </ElFormItem>

        <!-- Endpoints -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.endpoints')" schemaPath="service.endpoints" />
          </template>
          <div class="service-editor__endpoints">
            <div
              v-for="(endpoint, index) in (service.endpoints || [])"
              :key="`endpoint-${index}`"
              class="service-editor__endpoint-item"
            >
              <ElInput
                :model-value="endpoint"
                type="url"
                :placeholder="t('service.endpointPlaceholder')"
                class="service-editor__input"
                @update:model-value="updateEndpoint(Number(index), $event)"
              />
              <ElButton
                type="danger"
                :icon="Delete"
                size="small"
                @click="removeEndpoint(Number(index))"
              />
            </div>
            <ElButton
              type="primary"
              plain
              :icon="Plus"
              @click="addEndpoint"
            >
              {{ t('common.add') }}
            </ElButton>
          </div>
        </ElFormItem>

        <!-- Provider -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.provider')" schemaPath="service.provider" />
          </template>
          <OrganizationForm
            :model-value="service.provider || {}"
            :label="t('service.provider')"
            @update:model-value="updateProvider"
          />
        </ElFormItem>

        <ElDivider />

        <!-- BOM Ref -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.bomRef')" schemaPath="service.bom-ref" />
          </template>
          <ElInput
            :model-value="service['bom-ref']"
            readonly
            class="service-editor__input"
          />
        </ElFormItem>

        <!-- Group -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.group')" schemaPath="service.group" />
          </template>
          <ElInput
            :model-value="service.group"
            :placeholder="t('service.groupPlaceholder')"
            class="service-editor__input"
            @update:model-value="updateField('group', $event)"
          />
        </ElFormItem>

        <!-- Version -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.version')" schemaPath="service.version" />
          </template>
          <ElInput
            :model-value="service.version"
            :placeholder="t('service.versionPlaceholder')"
            class="service-editor__input"
            @update:model-value="updateField('version', $event)"
          />
        </ElFormItem>

        <!-- Authenticated -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.authenticated')" schemaPath="service.authenticated" />
          </template>
          <ElSwitch
            :model-value="service.authenticated || false"
            @update:model-value="updateField('authenticated', $event)"
          />
        </ElFormItem>

        <!-- Trust Boundary -->
        <ElFormItem>
          <template #label>
            <TooltipLabel :label="t('service.trustBoundary')" schemaPath="service.x-trust-boundary" />
          </template>
          <ElSwitch
            :model-value="service.trustBoundary || false"
            @update:model-value="updateField('trustBoundary', $event)"
          />
        </ElFormItem>

        <!-- Trust Zone -->
        <ElFormItem :label="t('service.trustZone')">
          <ElInput
            :model-value="service.trustZone"
            :placeholder="t('service.trustZonePlaceholder')"
            class="service-editor__input"
            @update:model-value="updateField('trustZone', $event)"
          />
        </ElFormItem>
      </ElForm>

      <p class="service-editor__info">{{ t('service.editorInfo') }}</p>
    </div>

    <template #footer>
      <div class="service-editor__footer">
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

.service-editor {
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
  }

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

  &__endpoints {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__endpoint-item {
    display: flex;
    gap: $space-3;
    align-items: center;
  }

  &__info {
    font-size: $text-sm;
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
