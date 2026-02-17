import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RelatedCryptoMaterialEditor from '../RelatedCryptoMaterialEditor.vue'
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

const HashFormStub = createNamedStub(
  'HashForm',
  '<div class="hash-form-stub" />',
  { modelValue: null, label: String },
  ['update:modelValue'],
)

const globalStubs = {
  ...elementStubs,
  TooltipLabel: TooltipLabelStub,
  HashForm: HashFormStub,
}

function createWrapper(props = {}) {
  return mount(RelatedCryptoMaterialEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('RelatedCryptoMaterialEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.rcm-props').exists()).toBe(true)
    })

    it('renders all field labels', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.type')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.state')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.id')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.value')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.size')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.format')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.creationDate')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.activationDate')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.updateDate')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.expirationDate')
      expect(text).toContain('component.cryptoProperties.relatedCryptoMaterialProperties.securedByMechanism')
    })

    it('renders HashForm sub-component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.hash-form-stub').exists()).toBe(true)
    })

    it('has 11 form items', () => {
      const wrapper = createWrapper()
      const formItems = wrapper.findAll('.el-form-item')
      expect(formItems.length).toBe(11)
    })
  })

  describe('enum options', () => {
    it('provides 19 material type options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[0].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(19)
    })

    it('includes expected material types', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[0].findAllComponents({ name: 'ElOption' })
      const values = options.map(o => o.props('value'))
      expect(values).toContain('private-key')
      expect(values).toContain('public-key')
      expect(values).toContain('secret-key')
      expect(values).toContain('ciphertext')
      expect(values).toContain('password')
      expect(values).toContain('token')
    })

    it('provides 6 material state options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[1].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(6)
    })

    it('includes expected states', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[1].findAllComponents({ name: 'ElOption' })
      const values = options.map(o => o.props('value'))
      expect(values).toEqual([
        'pre-activation', 'active', 'suspended', 'deactivated', 'compromised', 'destroyed',
      ])
    })
  })

  describe('updateField', () => {
    it('updates a string field', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateField('type', 'private-key')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'private-key' })
    })

    it('removes empty string fields', () => {
      const wrapper = createWrapper({
        modelValue: { type: 'private-key', id: 'key-1' },
      })
      ;(wrapper.vm as any).updateField('id', '')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'private-key' })
    })

    it('removes null fields', () => {
      const wrapper = createWrapper({ modelValue: { type: 'private-key' } })
      ;(wrapper.vm as any).updateField('type', null)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('preserves other fields', () => {
      const wrapper = createWrapper({
        modelValue: { type: 'private-key', state: 'active', format: 'PEM' },
      })
      ;(wrapper.vm as any).updateField('state', 'suspended')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        type: 'private-key',
        state: 'suspended',
        format: 'PEM',
      })
    })

    it('handles undefined modelValue', () => {
      const wrapper = createWrapper()
      ;(wrapper.vm as any).updateField('type', 'public-key')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'public-key' })
    })
  })

  describe('updateSecuredBy', () => {
    it('sets securedBy.mechanism', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateSecuredBy('mechanism', 'AES-256-GCM')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ securedBy: { mechanism: 'AES-256-GCM' } })
    })

    it('updates existing securedBy', () => {
      const wrapper = createWrapper({
        modelValue: { securedBy: { mechanism: 'old' } },
      })
      ;(wrapper.vm as any).updateSecuredBy('mechanism', 'new')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ securedBy: { mechanism: 'new' } })
    })

    it('removes securedBy when mechanism cleared', () => {
      const wrapper = createWrapper({
        modelValue: { type: 'private-key', securedBy: { mechanism: 'AES' } },
      })
      ;(wrapper.vm as any).updateSecuredBy('mechanism', '')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ type: 'private-key' })
      expect(emitted).not.toHaveProperty('securedBy')
    })

    it('removes securedBy when mechanism set to null', () => {
      const wrapper = createWrapper({
        modelValue: { securedBy: { mechanism: 'AES' } },
      })
      ;(wrapper.vm as any).updateSecuredBy('mechanism', null)
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({})
    })
  })

  describe('prop passing', () => {
    it('passes type to select', () => {
      const wrapper = createWrapper({ modelValue: { type: 'public-key' } })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects[0].props('modelValue')).toBe('public-key')
    })

    it('passes state to select', () => {
      const wrapper = createWrapper({ modelValue: { state: 'active' } })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects[1].props('modelValue')).toBe('active')
    })

    it('passes securedBy.mechanism to input', () => {
      const wrapper = createWrapper({
        modelValue: { securedBy: { mechanism: 'AES-256' } },
      })
      // securedBy mechanism is one of the inputs
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      // It's the last input before HashForm
      const mechanismInput = inputs.find(i => {
        // The input after expirationDate
        return true
      })
      // Check the last regular input
      const lastInput = inputs[inputs.length - 1]
      expect(lastInput.props('modelValue')).toBe('AES-256')
    })

    it('passes fingerprint to HashForm', () => {
      const fp = { alg: 'SHA-256', content: 'abc' }
      const wrapper = createWrapper({ modelValue: { fingerprint: fp } })
      const hashForm = wrapper.findComponent({ name: 'HashForm' })
      expect(hashForm.props('modelValue')).toEqual(fp)
    })
  })

  describe('sub-component events', () => {
    it('handles HashForm update', async () => {
      const wrapper = createWrapper({ modelValue: { type: 'public-key' } })
      const hashForm = wrapper.findComponent({ name: 'HashForm' })
      await hashForm.vm.$emit('update:modelValue', { alg: 'SHA-512', content: 'xyz' })
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({
        type: 'public-key',
        fingerprint: { alg: 'SHA-512', content: 'xyz' },
      })
    })
  })

  describe('template event handlers', () => {
    it('handles type select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[0].vm.$emit('update:modelValue', 'private-key')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'private-key' })
    })

    it('handles state select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[1].vm.$emit('update:modelValue', 'active')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ state: 'active' })
    })

    it('handles id input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[0].vm.$emit('update:modelValue', 'key-001')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ id: 'key-001' })
    })

    it('handles value textarea change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].vm.$emit('update:modelValue', 'base64data')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ value: 'base64data' })
    })

    it('handles size input change with number conversion', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[2].vm.$emit('update:modelValue', '256')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ size: 256 })
    })

    it('handles format input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[3].vm.$emit('update:modelValue', 'PEM')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ format: 'PEM' })
    })

    it('handles creationDate input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[4].vm.$emit('update:modelValue', '2024-01-01T00:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ creationDate: '2024-01-01T00:00:00Z' })
    })

    it('handles activationDate input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[5].vm.$emit('update:modelValue', '2024-01-01T00:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ activationDate: '2024-01-01T00:00:00Z' })
    })

    it('handles updateDate input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[6].vm.$emit('update:modelValue', '2024-06-15T12:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ updateDate: '2024-06-15T12:00:00Z' })
    })

    it('handles expirationDate input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[7].vm.$emit('update:modelValue', '2025-12-31T23:59:59Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ expirationDate: '2025-12-31T23:59:59Z' })
    })

    it('handles securedBy mechanism input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[8].vm.$emit('update:modelValue', 'AES-256-GCM')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ securedBy: { mechanism: 'AES-256-GCM' } })
    })
  })

  describe('no deprecated fields', () => {
    it('does not render deprecated algorithmRef', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).not.toContain('algorithmRef')
    })
  })
})
