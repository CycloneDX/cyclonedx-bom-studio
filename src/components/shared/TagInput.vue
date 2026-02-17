<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElInput, ElTag } from 'element-plus'

interface Props {
  modelValue?: string[]
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const inputValue = ref<string>('')
const tags = ref<string[]>([])

const initializeTags = (value?: string[]) => {
  tags.value = value ? [...value] : []
}

// Initialize from props
if (props.modelValue) {
  initializeTags(props.modelValue)
}

const handleInputKeydown = (event: Event | KeyboardEvent) => {
  if ('key' in event && event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}

const addTag = () => {
  const trimmedValue = inputValue.value.trim()
  if (trimmedValue && !tags.value.includes(trimmedValue)) {
    tags.value.push(trimmedValue)
    inputValue.value = ''
    emitUpdate()
  }
}

const removeTag = (index: number) => {
  tags.value.splice(index, 1)
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', tags.value)
}
</script>

<template>
  <div class="tag-input">
    <div class="tag-input__field">
      <ElInput
        v-model="inputValue"
        :placeholder="placeholder || t('forms.tagInput.addTag')"
        class="tag-input__input"
        @keydown="handleInputKeydown"
        clearable
      />
    </div>

    <div class="tag-input__tags">
      <ElTag
        v-for="(tag, index) in tags"
        :key="`tag-${index}`"
        closable
        class="tag-input__tag"
        @close="removeTag(index)"
      >
        {{ tag }}
      </ElTag>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.tag-input {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  width: 100%;

  &__field {
    width: 100%;
  }

  &__input {
    width: 100%;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;

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

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  &__tag {
    background-color: rgba($accent-primary, 0.1);
    border-color: rgba($accent-primary, 0.3);

    :deep(.el-tag__content) {
      color: $text-primary;
      font-size: $text-sm;
    }

    :deep(.el-icon) {
      color: $text-secondary;
      cursor: pointer;
      transition: color $transition-fast;

      &:hover {
        color: $text-primary;
      }
    }
  }
}
</style>
