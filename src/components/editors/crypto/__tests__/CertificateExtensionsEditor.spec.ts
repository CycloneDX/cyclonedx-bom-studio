import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CertificateExtensionsEditor from '../CertificateExtensionsEditor.vue'
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
  return mount(CertificateExtensionsEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('CertificateExtensionsEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.cert-ext-editor').exists()).toBe(true)
    })

    it('shows toolbar label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.certificateProperties.certificateExtensions')
    })

    it('hides table when empty', () => {
      const wrapper = createWrapper({ modelValue: [] })
      expect(wrapper.find('.el-table').exists()).toBe(false)
    })

    it('shows table when items exist', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: 'keyUsage', commonExtensionValue: 'digitalSignature' }],
      })
      expect(wrapper.find('.el-table').exists()).toBe(true)
    })

    it('renders 10 common extension options', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: '', commonExtensionValue: '' }],
      })
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(10)
    })
  })

  describe('add item', () => {
    it('adds new item with empty common fields', async () => {
      const wrapper = createWrapper({ modelValue: [] })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toEqual({ commonExtensionName: '', commonExtensionValue: '' })
    })

    it('appends to existing', async () => {
      const existing = [{ commonExtensionName: 'keyUsage', commonExtensionValue: 'sign' }]
      const wrapper = createWrapper({ modelValue: existing })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(2)
    })

    it('handles undefined modelValue', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([
        { commonExtensionName: '', commonExtensionValue: '' },
      ])
    })
  })

  describe('remove item', () => {
    it('removes item at index', () => {
      const wrapper = createWrapper({
        modelValue: [
          { commonExtensionName: 'keyUsage', commonExtensionValue: 'a' },
          { commonExtensionName: 'basicConstraints', commonExtensionValue: 'b' },
        ],
      })
      ;(wrapper.vm as any).removeItem(0)
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0].commonExtensionName).toBe('basicConstraints')
    })

    it('emits undefined when last item removed', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: 'keyUsage', commonExtensionValue: '' }],
      })
      ;(wrapper.vm as any).removeItem(0)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })
  })

  describe('update item', () => {
    it('updates common extension name', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: '', commonExtensionValue: '' }],
      })
      ;(wrapper.vm as any).updateItem(0, 'commonExtensionName', 'keyUsage')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].commonExtensionName).toBe('keyUsage')
      expect(emitted[0]).not.toHaveProperty('customExtensionName')
    })

    it('switches to custom extension name and removes common fields', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: 'keyUsage', commonExtensionValue: 'sign' }],
      })
      ;(wrapper.vm as any).updateItem(0, 'customExtensionName', 'myCustomExt')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].customExtensionName).toBe('myCustomExt')
      expect(emitted[0]).not.toHaveProperty('commonExtensionName')
      expect(emitted[0]).not.toHaveProperty('commonExtensionValue')
      expect(emitted[0].customExtensionValue).toBe('')
    })

    it('switches to common extension name and removes custom fields', () => {
      const wrapper = createWrapper({
        modelValue: [{ customExtensionName: 'myExt', customExtensionValue: 'val' }],
      })
      ;(wrapper.vm as any).updateItem(0, 'commonExtensionName', 'basicConstraints')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].commonExtensionName).toBe('basicConstraints')
      expect(emitted[0]).not.toHaveProperty('customExtensionName')
      expect(emitted[0]).not.toHaveProperty('customExtensionValue')
    })

    it('updates value fields correctly', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: 'keyUsage', commonExtensionValue: '' }],
      })
      ;(wrapper.vm as any).updateItem(0, 'commonExtensionValue', 'digitalSignature')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].commonExtensionValue).toBe('digitalSignature')
    })
  })

  describe('isCommon', () => {
    it('returns true for items with commonExtensionName', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).isCommon({ commonExtensionName: 'keyUsage' })).toBe(true)
    })

    it('returns false for items with customExtensionName', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).isCommon({ customExtensionName: 'myExt' })).toBe(false)
    })

    it('returns true for items with no extension type (defaults to common)', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).isCommon({})).toBe(true)
    })
  })

  describe('common extension names', () => {
    it('contains expected extension names', () => {
      const wrapper = createWrapper({
        modelValue: [{ commonExtensionName: '' }],
      })
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      const values = options.map(o => o.props('value'))
      expect(values).toContain('basicConstraints')
      expect(values).toContain('keyUsage')
      expect(values).toContain('extendedKeyUsage')
      expect(values).toContain('subjectAlternativeName')
      expect(values).toContain('certificatePolicies')
    })
  })
})
