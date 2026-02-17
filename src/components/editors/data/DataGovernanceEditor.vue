<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElFormItem, ElInput, ElDivider } from 'element-plus'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import GovernancePartyList from '@/components/editors/data/GovernancePartyList.vue'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const updateField = (field: string, value: any) => {
  const updated = { ...(props.modelValue || {}), [field]: value }
  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    delete updated[field]
  }
  const keys = Object.keys(updated).filter(k => updated[k] !== undefined)
  emit('update:modelValue', keys.length > 0 ? updated : undefined)
}
</script>

<template>
  <div class="data-governance">
    <ElDivider content-position="left">{{ t('component.dataSection.governance') }}</ElDivider>

    <!-- Owners -->
    <GovernancePartyList
      :label="t('component.dataSection.governanceOwners')"
      :model-value="modelValue?.owners"
      @update:model-value="updateField('owners', $event)"
    />

    <!-- Stewards -->
    <GovernancePartyList
      :label="t('component.dataSection.governanceStewards')"
      :model-value="modelValue?.stewards"
      @update:model-value="updateField('stewards', $event)"
    />

    <!-- Custodians -->
    <GovernancePartyList
      :label="t('component.dataSection.governanceCustodians')"
      :model-value="modelValue?.custodians"
      @update:model-value="updateField('custodians', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.data-governance {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}
</style>
