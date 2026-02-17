import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataGovernanceEditor from '../DataGovernanceEditor.vue'
import { elementStubs, createNamedStub } from '@/__tests__/testHelpers'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/stores/bomStore', () => ({
  useBomStore: () => ({ bom: { specVersion: '1.6' } }),
}))

vi.mock('@/composables/useSchemaTooltips', () => ({
  useSchemaTooltips: () => ({ tooltip: () => '' }),
}))

const TooltipLabelStub = createNamedStub(
  'TooltipLabel',
  '<span>{{ label }}</span>',
  { label: String, schemaPath: String },
  [],
)

const ElDividerStub = createNamedStub(
  'ElDivider',
  '<div class="el-divider"><slot /></div>',
  { contentPosition: String },
  [],
)

const GovernancePartyListStub = createNamedStub(
  'GovernancePartyList',
  '<div class="party-list-stub" />',
  { label: String, modelValue: null },
  ['update:modelValue'],
)

const globalStubs = {
  ...elementStubs,
  ElDivider: ElDividerStub,
  TooltipLabel: TooltipLabelStub,
  GovernancePartyList: GovernancePartyListStub,
}

function createWrapper(props = {}) {
  return mount(DataGovernanceEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('DataGovernanceEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.data-governance').exists()).toBe(true)
    })

    it('renders governance divider', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.dataSection.governance')
    })

    it('renders three GovernancePartyList components', () => {
      const wrapper = createWrapper()
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      expect(partyLists).toHaveLength(3)
    })

    it('passes correct labels to party lists', () => {
      const wrapper = createWrapper()
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      expect(partyLists[0].props('label')).toBe('component.dataSection.governanceOwners')
      expect(partyLists[1].props('label')).toBe('component.dataSection.governanceStewards')
      expect(partyLists[2].props('label')).toBe('component.dataSection.governanceCustodians')
    })
  })

  describe('updateField', () => {
    it('updates owners field', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateField('owners', [{ contact: { name: 'Alice' } }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ owners: [{ contact: { name: 'Alice' } }] })
    })

    it('updates stewards field', () => {
      const wrapper = createWrapper({ modelValue: { owners: [{ contact: { name: 'A' } }] } })
      ;(wrapper.vm as any).updateField('stewards', [{ contact: { name: 'Bob' } }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({
        owners: [{ contact: { name: 'A' } }],
        stewards: [{ contact: { name: 'Bob' } }],
      })
    })

    it('removes empty array fields', () => {
      const wrapper = createWrapper({
        modelValue: { owners: [{ contact: { name: 'A' } }], stewards: [{ contact: { name: 'B' } }] },
      })
      ;(wrapper.vm as any).updateField('owners', [])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ stewards: [{ contact: { name: 'B' } }] })
    })

    it('removes undefined fields', () => {
      const wrapper = createWrapper({
        modelValue: { owners: [{ contact: { name: 'A' } }] },
      })
      ;(wrapper.vm as any).updateField('owners', undefined)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })

    it('emits undefined when all fields removed', () => {
      const wrapper = createWrapper({
        modelValue: { custodians: [{ contact: { name: 'C' } }] },
      })
      ;(wrapper.vm as any).updateField('custodians', undefined)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })

    it('handles undefined modelValue', () => {
      const wrapper = createWrapper()
      ;(wrapper.vm as any).updateField('owners', [{ contact: { name: 'X' } }])
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        owners: [{ contact: { name: 'X' } }],
      })
    })
  })

  describe('prop passing', () => {
    it('passes owners to first GovernancePartyList', () => {
      const owners = [{ contact: { name: 'Alice' } }]
      const wrapper = createWrapper({ modelValue: { owners } })
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      expect(partyLists[0].props('modelValue')).toEqual(owners)
    })

    it('passes stewards to second GovernancePartyList', () => {
      const stewards = [{ contact: { name: 'Bob' } }]
      const wrapper = createWrapper({ modelValue: { stewards } })
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      expect(partyLists[1].props('modelValue')).toEqual(stewards)
    })

    it('passes custodians to third GovernancePartyList', () => {
      const custodians = [{ contact: { name: 'Charlie' } }]
      const wrapper = createWrapper({ modelValue: { custodians } })
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      expect(partyLists[2].props('modelValue')).toEqual(custodians)
    })
  })

  describe('sub-component events', () => {
    it('handles owners update from GovernancePartyList', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      await partyLists[0].vm.$emit('update:modelValue', [{ contact: { name: 'New' } }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ owners: [{ contact: { name: 'New' } }] })
    })

    it('handles stewards update', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      await partyLists[1].vm.$emit('update:modelValue', [{ contact: { name: 'Steward' } }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ stewards: [{ contact: { name: 'Steward' } }] })
    })

    it('handles custodians update', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const partyLists = wrapper.findAllComponents({ name: 'GovernancePartyList' })
      await partyLists[2].vm.$emit('update:modelValue', [{ contact: { name: 'Cust' } }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ custodians: [{ contact: { name: 'Cust' } }] })
    })
  })
})
