<script setup lang="ts">
import { ElCard } from 'element-plus'
import AddButton from '@/components/shared/AddButton.vue'

interface Props {
  title: string
  showAddButton?: boolean
  addDisabled?: boolean
}

withDefaults(defineProps<Props>(), {
  showAddButton: false,
  addDisabled: false
})

defineEmits<{
  add: []
}>()
</script>

<template>
  <ElCard class="editor-card">
    <template #header>
      <div class="editor-card__header">
        <h2 class="editor-card__title">
          <slot name="title">{{ title }}</slot>
        </h2>
        <div class="editor-card__actions">
          <slot name="header-actions" />
          <AddButton
            v-if="showAddButton"
            :disabled="addDisabled"
            @click="$emit('add')"
          />
        </div>
      </div>
    </template>

    <div class="editor-card__content">
      <slot />
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.editor-card {
  @include element-card;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
  }

  &__title {
    font-size: $text-xl;
    font-weight: $weight-bold;
    color: $text-primary;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: $space-3;
    align-items: center;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }
}
</style>
