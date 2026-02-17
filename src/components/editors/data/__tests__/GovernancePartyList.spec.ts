import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GovernancePartyList from '../GovernancePartyList.vue'
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

function createWrapper(props: any = { label: 'Owners' }) {
  return mount(GovernancePartyList, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('GovernancePartyList', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.governance-party-list').exists()).toBe(true)
    })

    it('displays the provided label', () => {
      const wrapper = createWrapper({ label: 'Custodians' })
      expect(wrapper.text()).toContain('Custodians')
    })

    it('hides table when empty', () => {
      const wrapper = createWrapper({ label: 'Owners', modelValue: [] })
      expect(wrapper.find('.el-table').exists()).toBe(false)
    })

    it('shows table when items exist', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [{ contact: { name: 'John' } }],
      })
      expect(wrapper.find('.el-table').exists()).toBe(true)
    })
  })

  describe('add item', () => {
    it('adds new contact party', async () => {
      const wrapper = createWrapper({ label: 'Owners', modelValue: [] })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toEqual({ contact: { name: '' } })
    })

    it('appends to existing items', async () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [{ contact: { name: 'Alice' } }],
      })
      await wrapper.find('.add-btn').trigger('click')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(2)
    })

    it('handles undefined modelValue', async () => {
      const wrapper = createWrapper({ label: 'Owners' })
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([
        { contact: { name: '' } },
      ])
    })
  })

  describe('remove item', () => {
    it('removes item at index', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [
          { contact: { name: 'Alice' } },
          { contact: { name: 'Bob' } },
        ],
      })
      ;(wrapper.vm as any).removeItem(0)
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0].contact.name).toBe('Bob')
    })

    it('emits undefined when last item removed', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [{ contact: { name: 'Alice' } }],
      })
      ;(wrapper.vm as any).removeItem(0)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })
  })

  describe('update item', () => {
    it('updates contact name', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [{ contact: { name: 'Alice' } }],
      })
      ;(wrapper.vm as any).updateItem(0, 'contactName', 'Bob')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contact.name).toBe('Bob')
      expect(emitted[0]).not.toHaveProperty('organization')
    })

    it('updates contact email', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [{ contact: { name: 'Alice' } }],
      })
      ;(wrapper.vm as any).updateItem(0, 'contactEmail', 'alice@example.com')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contact.email).toBe('alice@example.com')
      expect(emitted[0]).not.toHaveProperty('organization')
    })

    it('switches to organization and removes contact', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [{ contact: { name: 'Alice', email: 'a@b.com' } }],
      })
      ;(wrapper.vm as any).updateItem(0, 'orgName', 'ACME Corp')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].organization.name).toBe('ACME Corp')
      expect(emitted[0]).not.toHaveProperty('contact')
    })

    it('preserves other items when updating one', () => {
      const wrapper = createWrapper({
        label: 'Owners',
        modelValue: [
          { contact: { name: 'Alice' } },
          { contact: { name: 'Bob' } },
        ],
      })
      ;(wrapper.vm as any).updateItem(1, 'contactName', 'Charlie')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contact.name).toBe('Alice')
      expect(emitted[1].contact.name).toBe('Charlie')
    })
  })

  describe('getDisplayName', () => {
    it('returns contact name', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect((wrapper.vm as any).getDisplayName({ contact: { name: 'Alice' } })).toBe('Alice')
    })

    it('returns organization name', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect((wrapper.vm as any).getDisplayName({ organization: { name: 'ACME' } })).toBe('ACME')
    })

    it('returns empty string for empty item', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect((wrapper.vm as any).getDisplayName({})).toBe('')
    })

    it('prefers contact name over organization name', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect(
        (wrapper.vm as any).getDisplayName({
          contact: { name: 'Alice' },
          organization: { name: 'ACME' },
        })
      ).toBe('Alice')
    })
  })

  describe('getDisplayEmail', () => {
    it('returns contact email', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect(
        (wrapper.vm as any).getDisplayEmail({ contact: { email: 'a@b.com' } })
      ).toBe('a@b.com')
    })

    it('returns empty string when no email', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect((wrapper.vm as any).getDisplayEmail({ contact: { name: 'Alice' } })).toBe('')
    })

    it('returns empty string for organization items', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect(
        (wrapper.vm as any).getDisplayEmail({ organization: { name: 'ACME' } })
      ).toBe('')
    })

    it('returns empty string for empty item', () => {
      const wrapper = createWrapper({ label: 'Owners' })
      expect((wrapper.vm as any).getDisplayEmail({})).toBe('')
    })
  })
})
