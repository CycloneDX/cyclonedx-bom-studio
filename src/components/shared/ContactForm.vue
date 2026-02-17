<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElInput, ElButton, ElIcon } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

interface Contact {
  name?: string
  email?: string
  phone?: string
}

interface Props {
  modelValue?: Contact
  removable?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Contact): void
  (e: 'remove'): void
}

const props = withDefaults(defineProps<Props>(), {
  removable: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const contact = reactive<Contact>({
  name: props.modelValue?.name || '',
  email: props.modelValue?.email || '',
  phone: props.modelValue?.phone || ''
})

const updateField = (field: keyof Contact, value: string) => {
  contact[field] = value || undefined
  emit('update:modelValue', contact)
}

const handleRemove = () => {
  emit('remove')
}
</script>

<template>
  <div class="contact-form">
    <div class="contact-form__row">
      <div class="contact-form__field">
        <label class="contact-form__label">{{ t('forms.contact.name') }}</label>
        <ElInput
          :model-value="contact.name"
          :placeholder="t('forms.contact.namePlaceholder')"
          class="contact-form__input"
          @update:model-value="updateField('name', $event)"
        />
      </div>

      <div class="contact-form__field">
        <label class="contact-form__label">{{ t('forms.contact.email') }}</label>
        <ElInput
          :model-value="contact.email"
          type="email"
          :placeholder="t('forms.contact.emailPlaceholder')"
          class="contact-form__input"
          @update:model-value="updateField('email', $event)"
        />
      </div>

      <div class="contact-form__field">
        <label class="contact-form__label">{{ t('forms.contact.phone') }}</label>
        <ElInput
          :model-value="contact.phone"
          :placeholder="t('forms.contact.phonePlaceholder')"
          class="contact-form__input"
          @update:model-value="updateField('phone', $event)"
        />
      </div>

      <div v-if="removable" class="contact-form__remove-button">
        <ElButton
          type="danger"
          :icon="Delete"
          size="small"
          @click="handleRemove"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.contact-form {
  width: 100%;

  &__row {
    display: flex;
    gap: $space-4;
    align-items: flex-end;
    width: 100%;
  }

  &__field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-2;
    min-width: 0;
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

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
      transition: all $transition-base;

      &:hover {
        border-color: $border-default;
      }
    }

    :deep(.el-input__inner) {
      color: $text-primary;
      font-size: $text-base;

      &::placeholder {
        color: $text-secondary;
      }
    }

    :deep(.el-input.is-focus .el-input__wrapper) {
      box-shadow: 0 0 0 2px rgba($accent-primary, 0.1);
      border-color: $border-focus;
    }
  }

  &__remove-button {
    padding-bottom: 1px;

    :deep(.el-button) {
      --el-button-bg-color: rgba($red-500, 0.1);
      --el-button-border-color: rgba($red-500, 0.2);
      --el-button-text-color: $red-500;

      &:hover {
        --el-button-bg-color: rgba($red-500, 0.15);
        --el-button-border-color: $red-500;
      }
    }
  }
}
</style>
