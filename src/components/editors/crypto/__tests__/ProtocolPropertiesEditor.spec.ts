import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProtocolPropertiesEditor from '../ProtocolPropertiesEditor.vue'
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

const CipherSuiteEditorStub = createNamedStub(
  'CipherSuiteEditor',
  '<div class="cipher-suite-stub" />',
  { modelValue: null },
  ['update:modelValue'],
)

const Ikev2TransformTypesEditorStub = createNamedStub(
  'Ikev2TransformTypesEditor',
  '<div class="ikev2-stub" />',
  { modelValue: null },
  ['update:modelValue'],
)

const globalStubs = {
  ...elementStubs,
  TooltipLabel: TooltipLabelStub,
  CipherSuiteEditor: CipherSuiteEditorStub,
  Ikev2TransformTypesEditor: Ikev2TransformTypesEditorStub,
}

function createWrapper(props = {}) {
  return mount(ProtocolPropertiesEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('ProtocolPropertiesEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.protocol-props').exists()).toBe(true)
    })

    it('renders protocol type label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.protocolProperties.type')
    })

    it('renders version label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.protocolProperties.version')
    })

    it('renders CipherSuiteEditor sub-component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.cipher-suite-stub').exists()).toBe(true)
    })

    it('renders Ikev2TransformTypesEditor sub-component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.ikev2-stub').exists()).toBe(true)
    })

    it('provides 14 protocol type options', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(14)
    })
  })

  describe('protocol types', () => {
    it('includes expected protocol types', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      const values = options.map(o => o.props('value'))
      expect(values).toContain('tls')
      expect(values).toContain('ssh')
      expect(values).toContain('ipsec')
      expect(values).toContain('ike')
      expect(values).toContain('quic')
      expect(values).toContain('other')
      expect(values).toContain('unknown')
    })
  })

  describe('updateField', () => {
    it('updates type field', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateField('type', 'tls')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'tls' })
    })

    it('updates version field', () => {
      const wrapper = createWrapper({ modelValue: { type: 'tls' } })
      ;(wrapper.vm as any).updateField('version', '1.3')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'tls', version: '1.3' })
    })

    it('removes empty string fields', () => {
      const wrapper = createWrapper({ modelValue: { type: 'tls', version: '1.3' } })
      ;(wrapper.vm as any).updateField('version', '')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'tls' })
    })

    it('removes null fields', () => {
      const wrapper = createWrapper({ modelValue: { type: 'tls' } })
      ;(wrapper.vm as any).updateField('type', null)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('preserves other fields', () => {
      const wrapper = createWrapper({
        modelValue: { type: 'tls', version: '1.3', cipherSuites: [{ name: 'suite1' }] },
      })
      ;(wrapper.vm as any).updateField('version', '1.2')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({
        type: 'tls',
        version: '1.2',
        cipherSuites: [{ name: 'suite1' }],
      })
    })
  })

  describe('prop passing', () => {
    it('passes type to select', () => {
      const wrapper = createWrapper({ modelValue: { type: 'ssh' } })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      expect(select.props('modelValue')).toBe('ssh')
    })

    it('passes version to input', () => {
      const wrapper = createWrapper({ modelValue: { version: '2.0' } })
      const input = wrapper.findComponent({ name: 'ElInput' })
      expect(input.props('modelValue')).toBe('2.0')
    })

    it('passes cipherSuites to CipherSuiteEditor', () => {
      const suites = [{ name: 'TLS_AES_128_GCM', identifiers: [] }]
      const wrapper = createWrapper({ modelValue: { cipherSuites: suites } })
      const editor = wrapper.findComponent({ name: 'CipherSuiteEditor' })
      expect(editor.props('modelValue')).toEqual(suites)
    })

    it('passes ikev2TransformTypes to Ikev2TransformTypesEditor', () => {
      const transforms = { encr: [{ name: 'AES' }], esn: true }
      const wrapper = createWrapper({ modelValue: { ikev2TransformTypes: transforms } })
      const editor = wrapper.findComponent({ name: 'Ikev2TransformTypesEditor' })
      expect(editor.props('modelValue')).toEqual(transforms)
    })
  })

  describe('sub-component events', () => {
    it('handles CipherSuiteEditor update', async () => {
      const wrapper = createWrapper({ modelValue: { type: 'tls' } })
      const editor = wrapper.findComponent({ name: 'CipherSuiteEditor' })
      await editor.vm.$emit('update:modelValue', [{ name: 'suite1' }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ type: 'tls', cipherSuites: [{ name: 'suite1' }] })
    })

    it('handles Ikev2TransformTypesEditor update', async () => {
      const wrapper = createWrapper({ modelValue: { type: 'ike' } })
      const editor = wrapper.findComponent({ name: 'Ikev2TransformTypesEditor' })
      await editor.vm.$emit('update:modelValue', { encr: [{ name: 'AES' }] })
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ type: 'ike', ikev2TransformTypes: { encr: [{ name: 'AES' }] } })
    })
  })

  describe('template event handlers', () => {
    it('handles type select change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', 'tls')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ type: 'tls' })
    })

    it('handles version input change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const input = wrapper.findComponent({ name: 'ElInput' })
      await input.vm.$emit('update:modelValue', '1.3')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ version: '1.3' })
    })
  })

  describe('no deprecated fields', () => {
    it('does not render deprecated cryptoRefArray', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).not.toContain('cryptoRefArray')
    })
  })
})
