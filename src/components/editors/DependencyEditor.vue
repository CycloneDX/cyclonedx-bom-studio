<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElSelectV2, ElButton, ElIcon, ElAlert, ElEmpty, ElTabs, ElTabPane, ElPagination } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import { useDependencyFilter, formatType } from '@/composables/useDependencyFilter'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import RowActions from '@/components/shared/RowActions.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import DependencyFilterBar from '@/components/editors/DependencyFilterBar.vue'
import DependencyTreeView from '@/components/editors/DependencyTreeView.vue'
import DependencyGraphView from '@/components/editors/DependencyGraphView.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const activeTab = ref('table')

// Shared filter state used by all three tab views
const {
  filterType,
  filterGroup,
  filterName,
  filterSupplier,
  showServices,
  nodeMeta,
  availableTypes,
  availableGroups,
  availableSuppliers,
  filteredNodeIds,
  dependedUponCount,
  maxDepCount,
  adjacency,
  reverseAdjacency,
  activeLegendTypes,
  hasAnyFilters,
  resetFilters,
  getFullComponentInfo
} = useDependencyFilter()

// Refs to child components for "Fit" action
const graphViewRef = ref<InstanceType<typeof DependencyGraphView> | null>(null)
const treeViewRef = ref<InstanceType<typeof DependencyTreeView> | null>(null)

const handleFit = () => {
  if (activeTab.value === 'graph') {
    graphViewRef.value?.fitToContents()
  } else if (activeTab.value === 'tree') {
    treeViewRef.value?.resetView()
  }
}

const handleReset = () => {
  resetFilters()
}

// Table-specific: filter dependencies list by filteredNodeIds
const filteredDependencies = computed(() => {
  if (!hasAnyFilters.value) return bomStore.bom.dependencies
  return bomStore.bom.dependencies.filter((dep: any) => {
    if (dep.ref && filteredNodeIds.value.has(dep.ref)) return true
    if (dep.dependsOn) {
      return dep.dependsOn.some((ref: string) => filteredNodeIds.value.has(ref))
    }
    return false
  })
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(50)

const paginatedDependencies = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDependencies.value.slice(start, start + pageSize.value)
})

const totalFiltered = computed(() => filteredDependencies.value.length)

// Reset to page 1 when filters change
watch([() => filterType.value, () => filterGroup.value, () => filterName.value, () => filterSupplier.value], () => {
  currentPage.value = 1
})

const allRefs = computed(() => {
  const refs = [
    ...bomStore.bom.components.map((c: any) => ({ label: `${c.name} (${c.type})`, value: c['bom-ref'] })),
    ...bomStore.bom.services.map((s: any) => ({ label: `${s.name} (Service)`, value: s['bom-ref'] }))
  ]
  return refs
})

const referencedRefs = computed(() => {
  const referenced = new Set<string>()
  bomStore.bom.dependencies.forEach((dep: any) => {
    if (dep.ref) referenced.add(dep.ref)
    if (dep.dependsOn) {
      dep.dependsOn.forEach((ref: string) => referenced.add(ref))
    }
    if (dep.provides) {
      dep.provides.forEach((ref: string) => referenced.add(ref))
    }
  })
  return referenced
})

const hasCryptoAssets = computed(() => {
  return bomStore.bom.components.some((c: any) => c.type === 'cryptographic-asset')
})

const orphanedRefs = computed(() => {
  return allRefs.value
    .map((r: any) => r.value)
    .filter((ref: string) => !referencedRefs.value.has(ref))
})

// Convert page-relative index to the real bomStore index
const getStoreIndex = (pageIndex: number) => {
  const filteredIndex = (currentPage.value - 1) * pageSize.value + pageIndex
  const dep = filteredDependencies.value[filteredIndex]
  return dep ? bomStore.bom.dependencies.indexOf(dep) : -1
}

const updateDependencyRef = (pageIndex: number, ref: string) => {
  const realIndex = getStoreIndex(pageIndex)
  if (realIndex >= 0) {
    bomStore.bom.dependencies[realIndex].ref = ref
    bomStore.markModified()
  }
}

const updateDependsOn = (pageIndex: number, dependsOn: string[]) => {
  const realIndex = getStoreIndex(pageIndex)
  if (realIndex >= 0) {
    bomStore.bom.dependencies[realIndex].dependsOn = dependsOn
    bomStore.markModified()
  }
}

const updateProvides = (pageIndex: number, provides: string[]) => {
  const realIndex = getStoreIndex(pageIndex)
  if (realIndex >= 0) {
    bomStore.bom.dependencies[realIndex].provides = provides
    bomStore.markModified()
  }
}

const addDependency = () => {
  bomStore.addDependency()
}

const removeDependency = (pageIndex: number) => {
  const realIndex = getStoreIndex(pageIndex)
  if (realIndex >= 0) {
    bomStore.removeDependency(realIndex)
  }
}
</script>

<template>
  <div class="dependency-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard
        :title="t('dependencies.title')"
        :show-add-button="activeTab === 'table'"
        @add="addDependency"
      >
        <template #title>
          <TooltipLabel :label="t('dependencies.title')" schemaPath="bom.dependencies" />
        </template>

        <div class="dependency-editor__content">
          <!-- Shared filter bar for all tabs -->
          <DependencyFilterBar
            :filter-name="filterName"
            :filter-type="filterType"
            :filter-group="filterGroup"
            :filter-supplier="filterSupplier"
            :available-types="availableTypes"
            :available-groups="availableGroups"
            :available-suppliers="availableSuppliers"
            @update:filter-name="filterName = $event"
            @update:filter-type="filterType = $event"
            @update:filter-group="filterGroup = $event"
            @update:filter-supplier="filterSupplier = $event"
            @fit="handleFit"
            @reset="handleReset"
          />

          <ElTabs v-model="activeTab" class="dependency-editor__tabs">
            <!-- Tab 1: Table View -->
            <ElTabPane :label="t('dependencies.tableView')" name="table">
              <!-- Orphaned Components Warning -->
              <ElAlert
                v-if="orphanedRefs.length > 0 && !hasAnyFilters"
                :title="t('dependencies.orphanedWarning')"
                :description="t('dependencies.orphanedCount', { count: orphanedRefs.length })"
                type="warning"
                :closable="true"
                class="dependency-editor__warning"
              />

              <!-- Filter indicator -->
              <div v-if="hasAnyFilters" class="dependency-editor__filter-info">
                {{ t('dependencies.showingOf', { shown: filteredDependencies.length, total: bomStore.bom.dependencies.length }) }}
              </div>

              <!-- Dependencies Table -->
              <ElTable
                v-if="filteredDependencies.length > 0"
                :data="paginatedDependencies"
                class="dependency-editor__table"
              >
                <!-- Ref Column -->
                <ElTableColumn
                  :label="t('dependencies.ref')"
                  width="250"
                >
                  <template #default="{ row, $index }">
                    <ElSelectV2
                      :model-value="row.ref"
                      :options="allRefs"
                      class="dependency-editor__select"
                      filterable
                      @update:model-value="updateDependencyRef($index, $event)"
                    />
                  </template>
                </ElTableColumn>

                <!-- DependsOn Column -->
                <ElTableColumn
                  :label="t('dependencies.dependsOn')"
                  :min-width="300"
                >
                  <template #default="{ row, $index }">
                    <ElSelectV2
                      :model-value="row.dependsOn || []"
                      :options="allRefs"
                      multiple
                      collapse-tags
                      :collapse-tags-tooltip="true"
                      :max-collapse-tags="3"
                      class="dependency-editor__select"
                      filterable
                      @update:model-value="updateDependsOn($index, $event)"
                    />
                  </template>
                </ElTableColumn>

                <!-- Provides Column (only for cryptographic assets) -->
                <ElTableColumn
                  v-if="hasCryptoAssets"
                  :label="t('dependencies.provides')"
                  :min-width="300"
                >
                  <template #default="{ row, $index }">
                    <ElSelectV2
                      :model-value="row.provides || []"
                      :options="allRefs"
                      multiple
                      collapse-tags
                      :collapse-tags-tooltip="true"
                      :max-collapse-tags="3"
                      class="dependency-editor__select"
                      filterable
                      @update:model-value="updateProvides($index, $event)"
                    />
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
                      @delete="removeDependency($index)"
                    />
                  </template>
                </ElTableColumn>
              </ElTable>

              <div v-if="totalFiltered > pageSize" class="dependency-editor__pagination">
                <ElPagination
                  v-model:current-page="currentPage"
                  :page-size="pageSize"
                  :total="totalFiltered"
                  layout="prev, pager, next, total"
                />
              </div>

              <ElEmpty v-else-if="!hasAnyFilters" :description="t('dependencies.noDependencies')" />
              <ElEmpty v-else :description="t('dependencies.noMatchingFilters')" />
            </ElTabPane>

            <!-- Tab 2: Hierarchical Tree View -->
            <ElTabPane :label="t('dependencies.hierarchyView')" name="tree" :lazy="true">
              <DependencyTreeView
                ref="treeViewRef"
                :filtered-node-ids="filteredNodeIds"
                :node-meta="nodeMeta"
                :adjacency="adjacency"
                :reverse-adjacency="reverseAdjacency"
                :get-full-component-info="getFullComponentInfo"
              />
            </ElTabPane>

            <!-- Tab 3: Force-Directed Graph View -->
            <ElTabPane :label="t('dependencies.graphView')" name="graph" :lazy="true">
              <DependencyGraphView
                ref="graphViewRef"
                :filtered-node-ids="filteredNodeIds"
                :node-meta="nodeMeta"
                :depended-upon-count="dependedUponCount"
                :max-dep-count="maxDepCount"
                :active-legend-types="activeLegendTypes"
              />
            </ElTabPane>
          </ElTabs>
        </div>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.dependency-editor {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__filter-info {
    font-size: $text-xs;
    color: $text-tertiary;
    padding: $space-2 0;
    font-style: italic;
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: $space-4;
    }

    :deep(.el-tabs__nav-wrap::after) {
      background-color: $border-default;
    }

    :deep(.el-tabs__item) {
      color: $text-secondary;
      font-size: $text-sm;
      font-weight: $weight-medium;

      &.is-active {
        color: $accent-primary;
      }

      &:hover {
        color: $text-primary;
      }
    }

    :deep(.el-tabs__active-bar) {
      background-color: $accent-primary;
    }
  }

  &__warning {
    margin-bottom: $space-4;

    :deep(.el-alert__title) {
      color: $text-primary;
    }

    :deep(.el-alert__description) {
      color: $text-secondary;
    }
  }

  &__table {
    @include element-table;
  }

  &__select {
    @include element-input;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    padding: $space-4;
    border-top: 1px solid $border-default;
  }
}
</style>
