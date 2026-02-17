<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElPopconfirm } from 'element-plus'
import { Edit as EditIcon, Delete } from '@element-plus/icons-vue'

const { t } = useI18n()

withDefaults(defineProps<{
  showEdit?: boolean
  confirmDeleteTitle?: string
}>(), {
  showEdit: true,
})

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <div class="row-actions">
    <button
      v-if="showEdit"
      class="row-actions__btn row-actions__btn--edit"
      :title="t('common.edit')"
      @click="emit('edit')"
    >
      <EditIcon class="row-actions__icon" />
    </button>

    <ElPopconfirm
      :title="confirmDeleteTitle || t('common.confirmDelete')"
      @confirm="emit('delete')"
    >
      <template #reference>
        <button
          class="row-actions__btn row-actions__btn--delete"
          :title="t('common.delete')"
        >
          <Delete class="row-actions__icon" />
        </button>
      </template>
    </ElPopconfirm>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: $space-2;

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
    max-width: 28px;
    max-height: 28px;
    padding: 0;
    border-radius: $radius-sm;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    box-sizing: border-box;
    transition: background $transition-base, border-color $transition-base;

    &--edit {
      border: 1px solid $accent-primary;
      color: $accent-primary;

      &:hover {
        background: rgba($accent-primary, 0.1);
      }
    }

    &--delete {
      border: 1px solid $red-500;
      color: $red-500;

      &:hover {
        background: rgba($red-500, 0.1);
      }
    }
  }

  &__icon {
    width: 14px;
    height: 14px;
  }
}
</style>
