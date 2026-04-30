<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElIcon,
  ElButton,
  ElSelect,
  ElOption,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElAlert,
  ElMessage,
} from 'element-plus'
import { Upload, Delete, Check } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useSignatureStore } from '@/stores/signatureStore'
import { JSF_SIGN_ALGORITHMS } from '@/utils/jsfSignature'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()
const signatureStore = useSignatureStore()

// File upload reference for the PEM file picker.
const pemFileInput = ref<HTMLInputElement | null>(null)

const algorithms = JSF_SIGN_ALGORITHMS

const importedHadSignatures = computed(() => signatureStore.importedHadSignatures)
const hasSigningKey = computed(() => signatureStore.hasSigningKey)

const scopes = computed(() =>
  signatureStore.records.map(rec => ({
    rec,
    status: signatureStore.statusFor(rec, bomStore.bomForExport)
  }))
)

const handlePemUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    if (!text.includes('-----BEGIN')) {
      ElMessage.error(t('signatures.errorPemMissingHeader'))
      return
    }
    signatureStore.privateKeyPem = text
    ElMessage.success(t('signatures.keyLoaded'))
  } catch (err) {
    ElMessage.error(`Failed to read key file: ${err}`)
  } finally {
    if (pemFileInput.value) pemFileInput.value.value = ''
  }
}

const clearKey = () => {
  signatureStore.privateKeyPem = ''
  ElMessage.info(t('signatures.keyCleared'))
}

const statusTagType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'preserved-valid') return 'success'
  if (status === 'preserved-unverified') return 'warning'
  if (status === 'dirty-resigned') return 'info'
  if (status === 'dirty-unsigned') return 'danger'
  return 'info'
}

const statusLabel = (status: string): string => {
  switch (status) {
    case 'preserved-valid': return t('signatures.statusPreservedValid')
    case 'preserved-unverified': return t('signatures.statusPreservedUnverified')
    case 'dirty-resigned': return t('signatures.statusDirtyResigned')
    case 'dirty-unsigned': return t('signatures.statusDirtyUnsigned')
    default: return status
  }
}
</script>

<template>
  <div class="signature-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('signatures.title')">
        <ElAlert
          :title="t('signatures.trustNoticeTitle')"
          :description="t('signatures.trustNoticeBody')"
          type="info"
          show-icon
          :closable="false"
          class="signature-editor__alert"
        />

        <ElForm label-width="220px" class="signature-editor__form">
          <ElFormItem :label="t('signatures.algorithm')">
            <ElSelect v-model="signatureStore.algorithm" class="signature-editor__select">
              <ElOption v-for="a in algorithms" :key="a" :label="a" :value="a" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem :label="t('signatures.privateKey')">
            <div class="signature-editor__key-actions">
              <ElInput
                v-model="signatureStore.privateKeyPem"
                type="textarea"
                :rows="6"
                :placeholder="t('signatures.privateKeyPlaceholder')"
                class="signature-editor__key-input"
              />
              <div class="signature-editor__key-buttons">
                <!--
                  type="primary" plain matches every other action
                  button in the studio (TopBar, JsonSourceEditor copy /
                  download, etc.). Without it, Element Plus picks its
                  default blue, which clashes with the app's tokens.
                -->
                <ElButton
                  type="primary"
                  plain
                  :icon="Upload"
                  @click="pemFileInput?.click()"
                >
                  {{ t('signatures.uploadPem') }}
                </ElButton>
                <ElButton
                  type="primary"
                  plain
                  :icon="Delete"
                  :disabled="!hasSigningKey"
                  @click="clearKey"
                >
                  {{ t('signatures.clear') }}
                </ElButton>
                <input
                  ref="pemFileInput"
                  type="file"
                  accept=".pem,.key,.crt,.txt"
                  class="signature-editor__file-hidden"
                  @change="handlePemUpload"
                />
              </div>
            </div>
            <p class="signature-editor__hint">{{ t('signatures.privateKeyHint') }}</p>
          </ElFormItem>

          <ElFormItem
            v-if="!importedHadSignatures"
            :label="t('signatures.signRootAtSave')"
          >
            <ElSwitch v-model="signatureStore.signRootAtSave" />
            <p class="signature-editor__hint">{{ t('signatures.signRootAtSaveHint') }}</p>
          </ElFormItem>
        </ElForm>
      </EditorCard>

      <EditorCard :title="t('signatures.detectedTitle')" class="signature-editor__detected">
        <ElAlert
          v-if="!importedHadSignatures"
          :title="t('signatures.noneDetectedTitle')"
          :description="t('signatures.noneDetectedBody')"
          type="info"
          show-icon
          :closable="false"
        />
        <ElTable
          v-else
          :data="scopes"
          stripe
          row-key="rec.id"
          class="signature-editor__table"
        >
          <ElTableColumn :label="t('signatures.location')" prop="rec.scope.label" />
          <ElTableColumn :label="t('signatures.algorithm')" prop="rec.scope.algorithm" />
          <ElTableColumn :label="t('signatures.mode')" prop="rec.scope.mode" />
          <ElTableColumn :label="t('signatures.embeddedKey')" align="center">
            <template #default="{ row }">
              <ElIcon v-if="row.rec.scope.hasEmbeddedKey"><Check /></ElIcon>
              <span v-else>—</span>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('signatures.status')">
            <template #default="{ row }">
              <ElTag :type="statusTagType(row.status)" effect="dark">
                {{ statusLabel(row.status) }}
              </ElTag>
            </template>
          </ElTableColumn>
        </ElTable>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.signature-editor {
  width: 100%;

  &__alert {
    margin-bottom: $space-4;
  }

  &__form {
    :deep(.el-form-item__label) {
      color: $text-secondary;
      font-weight: $weight-medium;
    }
  }

  &__select {
    width: 240px;
    @include element-select;
  }

  &__key-actions {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    width: 100%;
  }

  &__key-input {
    @include element-input;

    :deep(.el-textarea__inner) {
      font-family: $font-mono;
      font-size: $text-xs;
    }
  }

  &__key-buttons {
    display: flex;
    gap: $space-2;
  }

  &__file-hidden {
    display: none;
  }

  &__hint {
    font-size: $text-xs;
    color: $text-secondary;
    margin: $space-2 0 0 0;
    font-style: italic;
  }

  &__detected {
    margin-top: $space-4;
  }

  &__table {
    width: 100%;
  }
}
</style>
