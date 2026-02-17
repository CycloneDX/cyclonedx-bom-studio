<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElButton, ElInput, ElPagination, ElPopconfirm, ElEmpty } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'
import EditorCard from '@/components/shared/EditorCard.vue'
import ServiceEditor from './ServiceEditor.vue'
import TooltipLabel from '@/components/shared/TooltipLabel.vue'
import RowActions from '@/components/shared/RowActions.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const editorVisible = ref(false)
const editingService = ref<any>(null)
const editingIndex = ref<number>(-1)
const selectedRows = ref<any[]>([])

const filteredServices = computed(() => {
  if (!searchQuery.value) return bomStore.bom.services

  const query = searchQuery.value.toLowerCase()
  return bomStore.bom.services.filter((svc: any) => {
    return svc.name?.toLowerCase().includes(query) ||
           svc.version?.toLowerCase().includes(query) ||
           svc.provider?.name?.toLowerCase().includes(query) ||
           svc.description?.toLowerCase().includes(query)
  })
})

const paginatedServices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredServices.value.slice(start, end)
})

const total = computed(() => filteredServices.value.length)

const getEndpointsSummary = (endpoints: string[]) => {
  if (!endpoints || endpoints.length === 0) return '—'
  return `${endpoints.length} endpoint(s)`
}

const openAddDialog = () => {
  editingService.value = {
    name: '',
    'bom-ref': Math.random().toString(36).substr(2, 9),
    endpoints: [],
    description: '',
    properties: []
  }
  editingIndex.value = -1
  editorVisible.value = true
}

const openEditDialog = (service: any, index: number) => {
  editingService.value = { ...service }
  editingIndex.value = index
  editorVisible.value = true
}

const handleServiceSave = () => {
  if (editingIndex.value === -1) {
    bomStore.addService(editingService.value)
  } else {
    bomStore.bom.services[editingIndex.value] = editingService.value
    bomStore.markModified()
  }
  editorVisible.value = false
}

const handleServiceClose = () => {
  editorVisible.value = false
}

const deleteService = (index: number) => {
  const actualIndex = bomStore.bom.services.indexOf(filteredServices.value[index])
  bomStore.removeService(actualIndex)
}

const deleteSelectedServices = () => {
  const indicesToDelete = selectedRows.value
    .map((row: any) => bomStore.bom.services.indexOf(row))
    .sort((a: number, b: number) => b - a)

  indicesToDelete.forEach((index: number) => {
    bomStore.removeService(index)
  })
  selectedRows.value = []
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}
</script>

<template>
  <div class="service-list-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('service.title')" :show-add-button="true" @add="openAddDialog">
        <template #title>
          <TooltipLabel :label="t('service.title')" schemaPath="bom.services" />
        </template>

        <template #header-actions>
          <ElInput
            v-model="searchQuery"
            :placeholder="t('common.search')"
            class="service-list-editor__search"
            clearable
          />
          <ElPopconfirm
            v-if="selectedRows.length > 0"
            :title="t('common.confirmDelete')"
            @confirm="deleteSelectedServices"
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

        <div class="service-list-editor__content">
        <ElTable
          v-if="paginatedServices.length > 0"
          :data="paginatedServices"
          class="service-list-editor__table"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn
            type="selection"
            width="50"
          />

          <ElTableColumn
            :label="t('service.name')"
            prop="name"
            sortable
          >
            <template #default="{ row }">
              <span class="service-list-editor__name">{{ row.name || '—' }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            :label="t('service.version')"
            prop="version"
            width="120"
            sortable
          >
            <template #default="{ row }">
              <span>{{ row.version || '—' }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            :label="t('service.provider')"
            prop="provider"
            width="150"
          >
            <template #default="{ row }">
              <span>{{ row.provider?.name || '—' }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            :label="t('service.endpoints')"
            width="130"
          >
            <template #default="{ row }">
              <span class="service-list-editor__endpoints">{{ getEndpointsSummary(row.endpoints) }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            :label="t('service.description')"
          >
            <template #default="{ row }">
              <span class="service-list-editor__description">{{ row.description || '—' }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            label=""
            width="100"
            fixed="right"
          >
            <template #default="{ $index, row }">
              <RowActions
                @edit="openEditDialog(row, bomStore.bom.services.indexOf(row))"
                @delete="deleteService($index)"
              />
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty v-else :description="t('common.noData')" />

          <div v-if="total > pageSize" class="service-list-editor__pagination">
            <ElPagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next, total"
            />
          </div>
        </div>
      </EditorCard>

      <ServiceEditor
        :visible="editorVisible"
        :model-value="editingService"
        @update:model-value="editingService = $event"
        @save="handleServiceSave"
        @close="handleServiceClose"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins-element' as *;

.service-list-editor {
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

  &__endpoints {
    color: $text-secondary;
    font-size: $text-sm;
  }

  &__description {
    color: $text-secondary;
    font-size: $text-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    padding: $space-4;
    border-top: 1px solid $border-default;
  }
}
</style>
