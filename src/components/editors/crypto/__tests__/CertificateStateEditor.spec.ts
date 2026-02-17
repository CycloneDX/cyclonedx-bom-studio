import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CertificateStateEditor from '../CertificateStateEditor.vue'
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
  return mount(CertificateStateEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('CertificateStateEditor', () => {
  describe('rendering', () => {
    it('renders without modelValue', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.cert-state-editor').exists()).toBe(true)
    })

    it('shows label text', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.certificateProperties.certificateState')
    })

    it('does not show table when empty', () => {
      const wrapper = createWrapper({ modelValue: [] })
      expect(wrapper.find('.el-table').exists()).toBe(false)
    })

    it('shows table when items exist', () => {
      const wrapper = createWrapper({ modelValue: [{ state: 'active' }] })
      expect(wrapper.find('.el-table').exists()).toBe(true)
    })

    it('renders 6 predefined state options', () => {
      const wrapper = createWrapper({ modelValue: [{ state: 'active' }] })
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(6)
    })
  })

  describe('add item', () => {
    it('adds a new state with default "active"', async () => {
      const wrapper = createWrapper({ modelValue: [] })
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([{ state: 'active' }])
    })

    it('appends to existing items', async () => {
      const wrapper = createWrapper({ modelValue: [{ state: 'revoked' }] })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(2)
      expect(emitted[0]).toEqual({ state: 'revoked' })
      expect(emitted[1]).toEqual({ state: 'active' })
    })

    it('handles undefined modelValue on add', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([{ state: 'active' }])
    })
  })

  describe('remove item', () => {
    it('removes item and emits updated array', () => {
      const wrapper = createWrapper({
        modelValue: [{ state: 'active' }, { state: 'revoked' }],
      })
      // Call removeItem directly via component
      ;(wrapper.vm as any).removeItem(0)
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toEqual({ state: 'revoked' })
    })

    it('emits undefined when last item removed', () => {
      const wrapper = createWrapper({
        modelValue: [{ state: 'active' }],
      })
      ;(wrapper.vm as any).removeItem(0)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })
  })

  describe('update item', () => {
    it('updates state field on existing item', () => {
      const wrapper = createWrapper({
        modelValue: [{ state: 'active' }],
      })
      ;(wrapper.vm as any).updateItem(0, 'state', 'suspended')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0]).toEqual({ state: 'suspended' })
    })

    it('preserves other items when updating one', () => {
      const wrapper = createWrapper({
        modelValue: [{ state: 'active' }, { state: 'revoked' }],
      })
      ;(wrapper.vm as any).updateItem(1, 'state', 'destroyed')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0]).toEqual({ state: 'active' })
      expect(emitted[1]).toEqual({ state: 'destroyed' })
    })
  })

  describe('predefined states', () => {
    it('has all 6 expected states', () => {
      const wrapper = createWrapper({ modelValue: [{ state: 'active' }] })
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      const values = options.map(o => o.props('value'))
      expect(values).toEqual([
        'pre-activation', 'active', 'suspended', 'deactivated', 'revoked', 'destroyed',
      ])
    })
  })
})
