<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElRadioGroup, ElRadio, ElInput, ElSelect, ElOption } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface License {
  expression?: string
  spdxId?: string
  name?: string
  url?: string
}

interface Props {
  modelValue?: License[]
}

interface Emits {
  (e: 'update:modelValue', value: License[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const SPDX_IDS = [
  'MIT',
  'Apache-2.0',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0',
  'LGPL-2.1-only',
  'AGPL-3.0-only',
  'Unlicense',
  'CC0-1.0',
  'EUPL-1.2',
  '0BSD',
  'Artistic-2.0',
  'CDDL-1.0',
  'EPL-2.0',
  'PostgreSQL',
  'Zlib',
  'BSL-1.0'
]

const state = reactive({
  mode: 'individual' as 'expression' | 'individual',
  expression: '',
  licenses: [] as License[]
})

// Initialize from props
if (props.modelValue && props.modelValue.length > 0) {
  const first = props.modelValue[0]
  if (first && first.expression) {
    state.mode = 'expression'
    state.expression = first.expression
  } else if (first) {
    state.mode = 'individual'
    state.licenses = JSON.parse(JSON.stringify(props.modelValue))
  }
}

const addLicense = () => {
  state.licenses.push({})
  emitUpdate()
}

const removeLicense = (index: number) => {
  state.licenses.splice(index, 1)
  emitUpdate()
}

const updateLicense = (index: number, field: keyof License, value: string) => {
  const license = state.licenses[index]
  if (!license) return
  license[field] = value || undefined
  emitUpdate()
}

const updateExpression = (value: string) => {
  state.expression = value
  emitUpdate()
}

const updateMode = (newMode: string | number | boolean | undefined) => {
  if (typeof newMode !== 'string') return
  state.mode = newMode as 'expression' | 'individual'
  if (newMode === 'expression') {
    state.licenses = []
    state.expression = ''
  } else {
    state.expression = ''
    state.licenses = []
  }
  emitUpdate()
}

const emitUpdate = () => {
  if (state.mode === 'expression' && state.expression) {
    emit('update:modelValue', [{ expression: state.expression }])
  } else if (state.mode === 'individual' && state.licenses.length > 0) {
    emit('update:modelValue', state.licenses)
  } else {
    emit('update:modelValue', [])
  }
}
</script>

<template>
  <div class="license-chooser">
    <div class="license-chooser__mode">
      <label class="license-chooser__mode-label">{{ t('forms.license.mode') }}</label>
      <ElRadioGroup
        :model-value="state.mode"
        class="license-chooser__radio-group"
        @update:model-value="updateMode"
      >
        <ElRadio value="expression">{{ t('forms.license.spdxExpression') }}</ElRadio>
        <ElRadio value="individual">{{ t('forms.license.individualLicenses') }}</ElRadio>
      </ElRadioGroup>
    </div>

    <div v-if="state.mode === 'expression'" class="license-chooser__expression">
      <label class="license-chooser__label">{{ t('forms.license.expressionPlaceholder') }}</label>
      <ElInput
        :model-value="state.expression"
        type="textarea"
        :rows="3"
        :placeholder="t('forms.license.expressionExample')"
        class="license-chooser__input"
        @update:model-value="updateExpression"
      />
      <p class="license-chooser__hint">{{ t('forms.license.expressionHint') }}</p>
    </div>

    <div v-if="state.mode === 'individual'" class="license-chooser__individual">
      <div class="license-chooser__section-header">
        <h4 class="license-chooser__subsection-title">{{ t('forms.license.licenses') }}</h4>
        <AddButton size="small" @click="addLicense" />
      </div>

      <div v-if="state.licenses.length > 0" class="license-chooser__licenses">
        <div v-for="(license, index) in state.licenses" :key="`license-${index}`" class="license-chooser__license-item">
          <div class="license-chooser__license-fields">
            <div class="license-chooser__field">
              <label class="license-chooser__label">{{ t('forms.license.spdxId') }}</label>
              <ElSelect
                :model-value="license.spdxId"
                filterable
                :placeholder="t('forms.license.selectSpdxId')"
                class="license-chooser__select"
                @update:model-value="updateLicense(index, 'spdxId', $event)"
              >
                <ElOption
                  v-for="id in SPDX_IDS"
                  :key="id"
                  :label="id"
                  :value="id"
                />
              </ElSelect>
            </div>

            <div class="license-chooser__field">
              <label class="license-chooser__label">{{ t('forms.license.customName') }}</label>
              <ElInput
                :model-value="license.name"
                :placeholder="t('forms.license.customNamePlaceholder')"
                class="license-chooser__input"
                @update:model-value="updateLicense(index, 'name', $event)"
              />
            </div>

            <div class="license-chooser__field">
              <label class="license-chooser__label">{{ t('forms.license.url') }}</label>
              <ElInput
                :model-value="license.url"
                type="url"
                :placeholder="t('forms.license.urlPlaceholder')"
                class="license-chooser__input"
                @update:model-value="updateLicense(index, 'url', $event)"
              />
            </div>
          </div>

          <RowActions
            :show-edit="false"
            class="license-chooser__remove-button"
            @delete="removeLicense(index)"
          />
        </div>
      </div>
      <p v-else class="license-chooser__empty-state">{{ t('forms.license.noLicenses') }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.license-chooser {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  width: 100%;

  &__mode {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__mode-label {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__radio-group {
    display: flex;
    gap: $space-4;

    :deep(.el-radio) {
      --el-radio-input-border-color: $border-default;
      --el-radio-input-fill: $accent-primary;
      --el-radio-checked-text-color: $accent-primary;

      .el-radio__label {
        color: $text-primary;
        font-size: $text-base;
      }

      &:hover {
        --el-radio-input-border-color: $border-focus;
      }
    }
  }

  &__expression {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__individual {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
  }

  &__subsection-title {
    font-size: $text-md;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0;
  }

  &__label {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    flex: 1;
  }

  &__input {
    width: 100%;
    @include element-input;
  }

  &__select {
    width: 100%;
    @include element-select;
  }

  &__licenses {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__license-item {
    display: flex;
    gap: $space-4;
    align-items: flex-start;
    padding: $space-4;
    background-color: rgba($accent-primary, 0.04);
    border: 1px solid $border-default;
    border-radius: $radius-md;
    transition: all $transition-base;

    &:hover {
      border-color: $border-subtle;
      background-color: rgba($accent-primary, 0.08);
    }
  }

  &__license-fields {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: $space-4;
    flex: 1;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &__remove-button {
    padding-top: $space-5;
  }

  &__hint {
    font-size: $text-sm;
    color: $text-secondary;
    margin: 0;
    font-style: italic;
  }

  &__empty-state {
    font-size: $text-sm;
    color: $text-secondary;
    font-style: italic;
    margin: 0;
    padding: $space-3;
  }
}

@include element-popper;
</style>
