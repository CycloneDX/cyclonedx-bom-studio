<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElButton, ElInput, ElPagination, ElPopconfirm, ElEmpty } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import ComponentEditor from './ComponentEditor.vue'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import RowActions from '@/components/shared/RowActions.vue'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const editorVisible = ref(false)
const editingComponent = ref<any>(null)
const editingIndex = ref<number>(-1)
const selectedRows = ref<any[]>([])

const filteredComponents = computed(() => {
  if (!searchQuery.value) return bomStore.bom.components

  const query = searchQuery.value.toLowerCase()
  return bomStore.bom.components.filter((comp: any) => {
    return comp.name?.toLowerCase().includes(query) ||
           comp.type?.toLowerCase().includes(query) ||
           comp.group?.toLowerCase().includes(query) ||
           comp.version?.toLowerCase().includes(query)
  })
})

const paginatedComponents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredComponents.value.slice(start, end)
})

const total = computed(() => filteredComponents.value.length)

const typeToI18nKey: { [key: string]: string } = {
  'application': 'application',
  'framework': 'framework',
  'library': 'library',
  'container': 'container',
  'platform': 'platform',
  'operating-system': 'operatingSystem',
  'device': 'device',
  'device-driver': 'deviceDriver',
  'firmware': 'firmware',
  'file': 'file',
  'machine-learning-model': 'machineLearningModel',
  'data': 'data',
  'cryptographic-asset': 'cryptographicAsset'
}

const getComponentTypeLabel = (type: string) => {
  const i18nKey = typeToI18nKey[type] || type
  const key = `component.types.${i18nKey}`
  return t(key) || type
}

const getLicenseSummary = (licenses: any[]) => {
  if (!licenses || licenses.length === 0) return '—'
  if (licenses.length === 1) {
    const lic = licenses[0]
    if (lic.expression) return lic.expression
    if (lic.license) {
      return lic.license.id || lic.license.name || '1 license'
    }
    return '1 license'
  }
  return `${licenses.length} licenses`
}

const openAddDialog = () => {
  editingComponent.value = {
    type: 'library',
    name: '',
    version: '',
    'bom-ref': Math.random().toString(36).substr(2, 9),
    group: '',
    description: '',
    licenses: [],
    hashes: [],
    externalReferences: [],
    properties: []
  }
  editingIndex.value = -1
  editorVisible.value = true
}

const openEditDialog = (component: any, index: number) => {
  editingComponent.value = { ...component }
  editingIndex.value = index
  editorVisible.value = true
}

const handleComponentSave = () => {
  if (editingIndex.value === -1) {
    bomStore.addComponent(editingComponent.value)
  } else {
    bomStore.bom.components[editingIndex.value] = editingComponent.value
    bomStore.markModified()
  }
  editorVisible.value = false
}

const handleComponentClose = () => {
  editorVisible.value = false
}

const deleteComponent = (index: number) => {
  const actualIndex = bomStore.bom.components.indexOf(filteredComponents.value[index])
  bomStore.removeComponent(actualIndex)
}

const deleteSelectedComponents = () => {
  const indicesToDelete = selectedRows.value
    .map((row: any) => bomStore.bom.components.indexOf(row))
    .sort((a: number, b: number) => b - a)

  indicesToDelete.forEach((index: number) => {
    bomStore.removeComponent(index)
  })
  selectedRows.value = []
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}
</script>

<template>
  <div class="component-list-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('component.title')" :show-add-button="true" @add="openAddDialog">
        <template #title>
          <TooltipLabel :label="t('component.title')" schemaPath="bom.components" />
        </template>

        <template #header-actions>
          <ElInput
            v-model="searchQuery"
            :placeholder="t('common.search')"
            class="component-list-editor__search"
            clearable
          />
          <ElPopconfirm
            v-if="selectedRows.length > 0"
            :title="t('common.confirmDelete')"
            @confirm="deleteSelectedComponents"
          >
            <template #reference>
              <ElButton
                type="danger"
                :icon="Delete"
              >
                {{ t('common.delete') }} ({{ selectedRows.length }})
              </ElButton>
            </template>
          </ElPopconfirm>
        </template>

        <div class="component-list-editor__content">
          <ElTable
            v-if="paginatedComponents.length > 0"
            :data="paginatedComponents"
            class="component-list-editor__table"
            @selection-change="handleSelectionChange"
          >
            <ElTableColumn
              type="selection"
              width="50"
            />

            <ElTableColumn
              :label="t('component.type')"
              prop="type"
              width="200"
              sortable
            >
              <template #default="{ row }">
                {{ getComponentTypeLabel(row.type) }}
              </template>
            </ElTableColumn>

            <ElTableColumn
              :label="t('component.name')"
              prop="name"
              sortable
            >
              <template #default="{ row }">
                <span class="component-list-editor__name">{{ row.name || '—' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn
              :label="t('component.version')"
              prop="version"
              width="120"
              sortable
            >
              <template #default="{ row }">
                <span>{{ row.version || '—' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn
              :label="t('component.group')"
              prop="group"
              width="150"
            >
              <template #default="{ row }">
                <span>{{ row.group || '—' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn
              :label="t('component.supplier')"
              prop="supplier"
              width="150"
            >
              <template #default="{ row }">
                <span>{{ row.supplier?.name || '—' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn
              :label="t('component.licenses')"
              width="130"
            >
              <template #default="{ row }">
                <span class="component-list-editor__licenses">{{ getLicenseSummary(row.licenses) }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn
              label=""
              width="100"
              fixed="right"
            >
              <template #default="{ $index, row }">
                <RowActions
                  @edit="openEditDialog(row, bomStore.bom.components.indexOf(row))"
                  @delete="deleteComponent($index)"
                />
              </template>
            </ElTableColumn>
          </ElTable>

          <ElEmpty v-else :description="t('common.noData')" />

          <div v-if="total > pageSize" class="component-list-editor__pagination">
            <ElPagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next, total"
            />
          </div>
        </div>
      </EditorCard>

      <ComponentEditor
        :visible="editorVisible"
        :model-value="editingComponent"
        @update:model-value="editingComponent = $event"
        @save="handleComponentSave"
        @close="handleComponentClose"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.component-list-editor {
  width: 100%;

  &__search {
    flex: 1;
    max-width: 300px;

    :deep(.el-input__wrapper) {
      background-color: $bg-input;
      border-color: $border-default;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__table {
    @include element-table;
  }

  &__name {
    color: $text-primary;
    font-weight: $weight-medium;
  }

  &__licenses {
    color: $text-secondary;
    font-size: $text-sm;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    padding: $space-4;
    border-top: 1px solid $border-default;
  }
}
</style>
