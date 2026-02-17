<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElInput } from 'element-plus'
import ContactForm from './ContactForm.vue'
import AddButton from '@/components/shared/AddButton.vue'
import RowActions from '@/components/shared/RowActions.vue'

interface Contact {
  name?: string
  email?: string
  phone?: string
}

interface Organization {
  name?: string
  urls?: string[]
  contacts?: Contact[]
}

interface Props {
  modelValue?: Organization
  label?: string
}

interface Emits {
  (e: 'update:modelValue', value: Organization): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Organization'
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const organization = reactive<Organization>({
  name: props.modelValue?.name || '',
  urls: props.modelValue?.urls ? [...props.modelValue.urls] : [],
  contacts: props.modelValue?.contacts ? JSON.parse(JSON.stringify(props.modelValue.contacts)) : []
})

const updateField = (field: keyof Organization, value: any) => {
  organization[field] = value
  emitUpdate()
}

const addUrl = () => {
  if (!organization.urls) {
    organization.urls = []
  }
  organization.urls.push('')
  emitUpdate()
}

const removeUrl = (index: number) => {
  if (organization.urls) {
    organization.urls.splice(index, 1)
    emitUpdate()
  }
}

const updateUrl = (index: number, value: string) => {
  if (organization.urls) {
    organization.urls[index] = value
    emitUpdate()
  }
}

const addContact = () => {
  if (!organization.contacts) {
    organization.contacts = []
  }
  organization.contacts.push({})
  emitUpdate()
}

const updateContact = (index: number, contact: Contact) => {
  if (organization.contacts) {
    organization.contacts[index] = contact
    emitUpdate()
  }
}

const removeContact = (index: number) => {
  if (organization.contacts) {
    organization.contacts.splice(index, 1)
    emitUpdate()
  }
}

const emitUpdate = () => {
  emit('update:modelValue', organization)
}
</script>

<template>
  <div class="organization-form">
    <div class="organization-form__section">
      <h3 class="organization-form__section-title">{{ props.label }}</h3>

      <div class="organization-form__field">
        <label class="organization-form__label">{{ t('forms.organization.name') }}</label>
        <ElInput
          :model-value="organization.name"
          :placeholder="t('forms.organization.namePlaceholder')"
          class="organization-form__input"
          @update:model-value="updateField('name', $event)"
        />
      </div>
    </div>

    <div class="organization-form__section">
      <div class="organization-form__section-header">
        <h4 class="organization-form__subsection-title">{{ t('forms.organization.urls') }}</h4>
        <AddButton size="small" @click="addUrl" />
      </div>

      <div v-if="organization.urls && organization.urls.length > 0" class="organization-form__urls">
        <div v-for="(url, index) in organization.urls" :key="`url-${index}`" class="organization-form__url-item">
          <ElInput
            :model-value="url"
            type="url"
            :placeholder="t('forms.organization.urlPlaceholder')"
            class="organization-form__input"
            @update:model-value="updateUrl(index, $event)"
          />
          <RowActions
            :show-edit="false"
            @delete="removeUrl(index)"
          />
        </div>
      </div>
      <p v-else class="organization-form__empty-state">{{ t('forms.organization.noUrls') }}</p>
    </div>

    <div class="organization-form__section">
      <div class="organization-form__section-header">
        <h4 class="organization-form__subsection-title">{{ t('forms.organization.contacts') }}</h4>
        <AddButton size="small" @click="addContact" />
      </div>

      <div v-if="organization.contacts && organization.contacts.length > 0" class="organization-form__contacts">
        <div v-for="(contact, index) in organization.contacts" :key="`contact-${index}`" class="organization-form__contact-item">
          <ContactForm
            :model-value="contact"
            removable
            @update:model-value="updateContact(index, $event)"
            @remove="removeContact(index)"
          />
        </div>
      </div>
      <p v-else class="organization-form__empty-state">{{ t('forms.organization.noContacts') }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.organization-form {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  width: 100%;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__section-title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0;
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

  &__urls {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__url-item {
    display: flex;
    gap: $space-3;
    align-items: flex-start;

    .organization-form__input {
      flex: 1;
    }
  }

  &__contacts {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__contact-item {
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

  &__empty-state {
    font-size: $text-sm;
    color: $text-secondary;
    font-style: italic;
    margin: 0;
    padding: $space-3;
  }
}
</style>
