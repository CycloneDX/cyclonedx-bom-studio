import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SensitiveDataEditor from '../SensitiveDataEditor.vue'
import { elementStubs, createNamedStub } from '@/__tests__/testHelpers'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const ElTableStub = createNamedStub(
  'ElTable',
  '<div class="el-table"><slot /></div>',
  { data: Array, stripe: Boolean },
  [],
)

const ElTableColumnStub = createNamedStub(
  'ElTableColumn',
  '<div class="el-table-column"><slot v-bind="{ row: { value: \'\', index: 0 }, $index: 0 }" /></div>',
  { label: String, minWidth: [String, Number], width: [String, Number], fixed: String },
  [],
)

const AddButtonStub = createNamedStub(
  'AddButton',
  '<button class="add-btn" @click="$emit(\'click\')">Add</button>',
  { size: String },
  ['click'],
)

const RowActionsStub = createNamedStub(
  'RowActions',
  '<button class="delete-btn" @click="$emit(\'delete\')">Delete</button>',
  { showEdit: Boolean },
  ['edit', 'delete'],
)

const globalStubs = {
  ...elementStubs,
  ElTable: ElTableStub,
  ElTableColumn: ElTableColumnStub,
  AddButton: AddButtonStub,
  RowActions: RowActionsStub,
}

function createWrapper(props = {}) {
  return mount(SensitiveDataEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('SensitiveDataEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.sensitive-data-editor').exists()).toBe(true)
    })

    it('shows label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.dataSection.sensitiveData')
    })

    it('hides table when empty', () => {
      const wrapper = createWrapper({ modelValue: [] })
      expect(wrapper.find('.el-table').exists()).toBe(false)
    })

    it('shows table when items exist', () => {
      const wrapper = createWrapper({ modelValue: ['PII'] })
      expect(wrapper.find('.el-table').exists()).toBe(true)
    })
  })

  describe('add item', () => {
    it('adds empty string item', async () => {
      const wrapper = createWrapper({ modelValue: [] })
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([''])
    })

    it('appends to existing items', async () => {
      const wrapper = createWrapper({ modelValue: ['PII', 'PHI'] })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as string[]
      expect(emitted).toEqual(['PII', 'PHI', ''])
    })

    it('handles undefined modelValue', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([''])
    })
  })

  describe('remove item', () => {
    it('removes item at index', () => {
      const wrapper = createWrapper({ modelValue: ['PII', 'PHI', 'PCI'] })
      ;(wrapper.vm as any).removeItem(1)
      const emitted = wrapper.emitted('update:modelValue')![0][0] as string[]
      expect(emitted).toEqual(['PII', 'PCI'])
    })

    it('emits undefined when last item removed', () => {
      const wrapper = createWrapper({ modelValue: ['PII'] })
      ;(wrapper.vm as any).removeItem(0)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })
  })

  describe('update item', () => {
    it('updates item at index', () => {
      const wrapper = createWrapper({ modelValue: ['PII', 'PHI'] })
      ;(wrapper.vm as any).updateItem(0, 'Personal Health Information')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as string[]
      expect(emitted).toEqual(['Personal Health Information', 'PHI'])
    })

    it('preserves other items when updating one', () => {
      const wrapper = createWrapper({ modelValue: ['a', 'b', 'c'] })
      ;(wrapper.vm as any).updateItem(1, 'updated')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as string[]
      expect(emitted).toEqual(['a', 'updated', 'c'])
    })
  })
})
