import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CipherSuiteEditor from '../CipherSuiteEditor.vue'
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
  '<div class="el-table-column"><slot v-bind="{ row: {}, $index: 0 }" /></div>',
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
  return mount(CipherSuiteEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('CipherSuiteEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.cipher-suite-editor').exists()).toBe(true)
    })

    it('shows toolbar label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.protocolProperties.cipherSuites')
    })

    it('hides table when empty', () => {
      const wrapper = createWrapper({ modelValue: [] })
      expect(wrapper.find('.el-table').exists()).toBe(false)
    })

    it('shows table when items exist', () => {
      const wrapper = createWrapper({
        modelValue: [{ name: 'TLS_AES_128_GCM_SHA256', identifiers: [] }],
      })
      expect(wrapper.find('.el-table').exists()).toBe(true)
    })
  })

  describe('add item', () => {
    it('adds new empty cipher suite', async () => {
      const wrapper = createWrapper({ modelValue: [] })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toEqual({ name: '', identifiers: [], algorithms: [] })
    })

    it('appends to existing items', async () => {
      const existing = [{ name: 'Suite1', identifiers: ['0x00,0x2F'] }]
      const wrapper = createWrapper({ modelValue: existing })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(2)
    })

    it('handles undefined modelValue', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([
        { name: '', identifiers: [], algorithms: [] },
      ])
    })
  })

  describe('remove item', () => {
    it('removes item at specified index', () => {
      const wrapper = createWrapper({
        modelValue: [
          { name: 'Suite1', identifiers: [] },
          { name: 'Suite2', identifiers: [] },
        ],
      })
      ;(wrapper.vm as any).removeItem(0)
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0].name).toBe('Suite2')
    })

    it('emits undefined when last item removed', () => {
      const wrapper = createWrapper({
        modelValue: [{ name: 'Suite1', identifiers: [] }],
      })
      ;(wrapper.vm as any).removeItem(0)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })
  })

  describe('update item', () => {
    it('updates name field', () => {
      const wrapper = createWrapper({
        modelValue: [{ name: 'old', identifiers: [] }],
      })
      ;(wrapper.vm as any).updateItem(0, 'name', 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].name).toBe('TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256')
    })

    it('updates identifiers field', () => {
      const wrapper = createWrapper({
        modelValue: [{ name: 'Suite1', identifiers: [] }],
      })
      ;(wrapper.vm as any).updateItem(0, 'identifiers', ['0x00', '0x2F'])
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].identifiers).toEqual(['0x00', '0x2F'])
    })
  })

  describe('parseCommaSeparated', () => {
    it('parses comma-separated values', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseCommaSeparated('a, b, c')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('trims whitespace', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseCommaSeparated('  a  ,  b  ')
      expect(result).toEqual(['a', 'b'])
    })

    it('filters empty strings', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseCommaSeparated('a,,b,')
      expect(result).toEqual(['a', 'b'])
    })

    it('handles empty input', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseCommaSeparated('')
      expect(result).toEqual([])
    })
  })

  describe('joinArray', () => {
    it('joins array with comma separator', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).joinArray(['a', 'b', 'c'])
      expect(result).toBe('a, b, c')
    })

    it('returns empty string for null', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).joinArray(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).joinArray(undefined)).toBe('')
    })

    it('returns empty string for non-array', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).joinArray('not-an-array')).toBe('')
    })
  })
})
