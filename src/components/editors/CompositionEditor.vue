<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElSelect, ElOption, ElButton, ElEmpty } from 'element-plus'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import RowActions from '@/components/shared/RowActions.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const aggregateOptions = [
  { label: t('composition.complete'), value: 'complete' },
  { label: t('composition.incomplete'), value: 'incomplete' },
  { label: t('composition.incompleteFirstPartyOnly'), value: 'incomplete_first_party_only' },
  { label: t('composition.incompleteFirstPartyProprietary'), value: 'incomplete_first_party_proprietary_only' },
  { label: t('composition.incompleteFirstPartyOpenSource'), value: 'incomplete_first_party_opensource_only' },
  { label: t('composition.incompleteThirdPartyOnly'), value: 'incomplete_third_party_only' },
  { label: t('composition.incompleteThirdPartyProprietary'), value: 'incomplete_third_party_proprietary_only' },
  { label: t('composition.incompleteThirdPartyOpenSource'), value: 'incomplete_third_party_opensource_only' },
  { label: t('composition.unknown'), value: 'unknown' },
  { label: t('composition.notSpecified'), value: 'not_specified' }
]

const allRefs = computed(() => {
  const refs = [
    ...bomStore.bom.components.map((c: any) => ({ label: `${c.name} (${c.type})`, value: c['bom-ref'] })),
    ...bomStore.bom.services.map((s: any) => ({ label: `${s.name} (Service)`, value: s['bom-ref'] }))
  ]
  return refs
})

const updateAggregate = (index: number, aggregate: string) => {
  bomStore.bom.compositions[index].aggregate = aggregate
  bomStore.markModified()
}

const updateAssemblies = (index: number, assemblies: string[]) => {
  bomStore.bom.compositions[index].assemblies = assemblies
  bomStore.markModified()
}

const addComposition = () => {
  if (!bomStore.bom.compositions) {
    bomStore.bom.compositions = []
  }
  bomStore.bom.compositions.push({
    aggregate: 'complete',
    assemblies: []
  })
  bomStore.markModified()
}

const removeComposition = (index: number) => {
  bomStore.bom.compositions.splice(index, 1)
  bomStore.markModified()
}
</script>

<template>
  <div class="composition-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard
        :title="t('compositions.title')"
        show-add-button
        @add="addComposition"
      >
        <template #title>
          <TooltipLabel :label="t('compositions.title')" schemaPath="bom.compositions" />
        </template>

        <div class="composition-editor__content">
          <ElTable
            v-if="bomStore.bom.compositions && bomStore.bom.compositions.length > 0"
            :data="bomStore.bom.compositions"
            class="composition-editor__table"
          >
            <!-- Aggregate Column -->
            <ElTableColumn
              :label="t('composition.aggregate')"
              width="250"
            >
              <template #default="{ row, $index }">
                <ElSelect
                  :model-value="row.aggregate"
                  class="composition-editor__select"
                  @update:model-value="updateAggregate($index, $event)"
                >
                  <ElOption
                    v-for="option in aggregateOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>

            <!-- Assemblies Column -->
            <ElTableColumn
              :label="t('composition.assemblies')"
              :min-width="400"
            >
              <template #default="{ row, $index }">
                <ElSelect
                  :model-value="row.assemblies || []"
                  multiple
                  class="composition-editor__select"
                  filterable
                  @update:model-value="updateAssemblies($index, $event)"
                >
                  <ElOption
                    v-for="ref in allRefs"
                    :key="ref.value"
                    :label="ref.label"
                    :value="ref.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>

            <!-- Actions Column -->
            <ElTableColumn
              label=""
              width="80"
              fixed="right"
            >
              <template #default="{ $index }">
                <RowActions
                  :show-edit="false"
                  @delete="removeComposition($index)"
                />
              </template>
            </ElTableColumn>
          </ElTable>

          <ElEmpty v-else :description="t('compositions.noCompositions')" />
        </div>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.composition-editor {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__table {
    @include element-table;
  }

  &__select {
    @include element-input;
  }
}
</style>
