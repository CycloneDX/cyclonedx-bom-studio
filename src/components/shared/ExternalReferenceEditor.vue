<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElSelect, ElOption, ElInput } from 'element-plus'
import { useSpecVersionGating } from '@/composables/useSpecVersionGating'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface ExternalReference {
  type: string
  url: string
  comment?: string
  hashes?: Array<{ alg: string; content: string }>
}

interface Props {
  modelValue?: ExternalReference[]
}

interface Emits {
  (e: 'update:modelValue', value: ExternalReference[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { availableExtRefTypes } = useSpecVersionGating()

const references = reactive<ExternalReference[]>([])

// Initialize from props
if (props.modelValue) {
  references.push(...JSON.parse(JSON.stringify(props.modelValue)))
}

const addReference = () => {
  references.push({
    type: 'website',
    url: '',
    comment: '',
    hashes: []
  })
  emitUpdate()
}

const removeReference = (index: number) => {
  references.splice(index, 1)
  emitUpdate()
}

const updateReference = (index: number, field: keyof ExternalReference, value: string) => {
  const ref = references[index]
  if (!ref) return
  if (field === 'type') {
    ref.type = value
  } else if (field === 'url') {
    ref.url = value
  } else if (field === 'comment') {
    ref.comment = value || undefined
  }
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', references)
}
</script>

<template>
  <div class="external-reference-editor">
    <div class="external-reference-editor__toolbar">
      <h3 class="external-reference-editor__title">{{ t('forms.externalReference.title') }}</h3>
      <AddButton size="small" @click="addReference" />
    </div>

    <div v-if="references.length > 0" class="external-reference-editor__references">
      <div v-for="(reference, index) in references" :key="`ref-${index}`" class="external-reference-editor__reference-item">
        <div class="external-reference-editor__reference-fields">
          <div class="external-reference-editor__field">
            <label class="external-reference-editor__label">{{ t('forms.externalReference.type') }}</label>
            <ElSelect
              :model-value="reference.type"
              filterable
              :placeholder="t('forms.externalReference.selectType')"
              class="external-reference-editor__select"
              @update:model-value="updateReference(index, 'type', $event)"
            >
              <ElOption
                v-for="refType in availableExtRefTypes"
                :key="refType"
                :label="refType"
                :value="refType"
              />
            </ElSelect>
          </div>

          <div class="external-reference-editor__field">
            <label class="external-reference-editor__label">{{ t('forms.externalReference.url') }}</label>
            <ElInput
              :model-value="reference.url"
              type="url"
              :placeholder="t('forms.externalReference.urlPlaceholder')"
              class="external-reference-editor__input"
              @update:model-value="updateReference(index, 'url', $event)"
            />
          </div>

          <div class="external-reference-editor__field">
            <label class="external-reference-editor__label">{{ t('forms.externalReference.comment') }}</label>
            <ElInput
              :model-value="reference.comment"
              :placeholder="t('forms.externalReference.commentPlaceholder')"
              class="external-reference-editor__input"
              @update:model-value="updateReference(index, 'comment', $event)"
            />
          </div>
        </div>

        <RowActions
          :show-edit="false"
          class="external-reference-editor__remove-button"
          @delete="removeReference(index)"
        />
      </div>
    </div>
    <p v-else class="external-reference-editor__empty-state">{{ t('forms.externalReference.noReferences') }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.external-reference-editor {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 100%;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
  }

  &__title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0;
  }

  &__references {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__reference-item {
    display: flex;
    gap: $space-4;
    align-items: flex-end;
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

  &__reference-fields {
    display: grid;
    grid-template-columns: 200px 1fr 1fr;
    gap: $space-4;
    flex: 1;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__label {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__input {
    width: 100%;
    @include element-input;
  }

  &__select {
    width: 100%;
    @include element-select;
  }

  &__remove-button {
    flex-shrink: 0;
    margin-bottom: 2px;
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
