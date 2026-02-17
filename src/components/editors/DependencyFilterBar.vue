<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElSelect, ElOption, ElInput, ElButton } from 'element-plus'
import { formatType } from '@/composables/useDependencyFilter'

const { t } = useI18n()

defineProps<{
  filterName: string
  filterType: string
  filterGroup: string
  filterSupplier: string
  availableTypes: string[]
  availableGroups: string[]
  availableSuppliers: string[]
}>()

const emit = defineEmits<{
  'update:filterName': [value: string]
  'update:filterType': [value: string]
  'update:filterGroup': [value: string]
  'update:filterSupplier': [value: string]
  'fit': []
  'reset': []
}>()
</script>

<template>
  <div class="dep-filter-bar">
    <div class="dep-filter-bar__row">
      <ElInput
        :model-value="filterName"
        :placeholder="t('dependencies.filterByName')"
        clearable
        size="small"
        class="dep-filter-bar__input dep-filter-bar__input--name"
        @update:model-value="emit('update:filterName', $event as string)"
      />
      <ElSelect
        :model-value="filterType"
        :placeholder="t('dependencies.filterByType')"
        clearable
        size="small"
        class="dep-filter-bar__select"
        @update:model-value="emit('update:filterType', $event as string)"
      >
        <ElOption
          v-for="t in availableTypes"
          :key="t"
          :label="formatType(t)"
          :value="t"
        />
      </ElSelect>
      <ElSelect
        v-if="availableGroups.length > 0"
        :model-value="filterGroup"
        :placeholder="t('dependencies.filterByGroup')"
        clearable
        size="small"
        class="dep-filter-bar__select"
        @update:model-value="emit('update:filterGroup', $event as string)"
      >
        <ElOption
          v-for="g in availableGroups"
          :key="g"
          :label="g"
          :value="g"
        />
      </ElSelect>
      <ElSelect
        v-if="availableSuppliers.length > 0"
        :model-value="filterSupplier"
        :placeholder="t('dependencies.filterBySupplier')"
        clearable
        size="small"
        class="dep-filter-bar__select"
        @update:model-value="emit('update:filterSupplier', $event as string)"
      >
        <ElOption
          v-for="s in availableSuppliers"
          :key="s"
          :label="s"
          :value="s"
        />
      </ElSelect>
      <ElButton size="small" @click="emit('fit')" class="dep-filter-bar__btn">{{ t('common.fit') }}</ElButton>
      <ElButton size="small" @click="emit('reset')" class="dep-filter-bar__btn">{{ t('common.reset') }}</ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.dep-filter-bar {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &__row {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-wrap: wrap;
  }

  &__input {
    width: 200px;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
    }

    :deep(.el-input__inner) {
      color: $text-primary;
      font-size: $text-xs;
    }

    &--name {
      width: 200px;
    }
  }

  &__select {
    width: 160px;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
    }

    :deep(.el-input__inner) {
      color: $text-primary;
      font-size: $text-xs;
    }
  }

  &__btn {
    font-size: $text-xs;
  }
}
</style>
