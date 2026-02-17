import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import CertificatePropertiesEditor from '../CertificatePropertiesEditor.vue'
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

const HashFormStub = createNamedStub(
  'HashForm',
  '<div class="hash-form-stub" />',
  { modelValue: null, label: String },
  ['update:modelValue'],
)

const CertificateStateEditorStub = createNamedStub(
  'CertificateStateEditor',
  '<div class="cert-state-stub" />',
  { modelValue: null },
  ['update:modelValue'],
)

const CertificateExtensionsEditorStub = createNamedStub(
  'CertificateExtensionsEditor',
  '<div class="cert-ext-stub" />',
  { modelValue: null },
  ['update:modelValue'],
)

const TooltipLabelStub = createNamedStub(
  'TooltipLabel',
  '<span>{{ label }}</span>',
  { label: String, schemaPath: String },
  [],
)

const globalStubs = {
  ...elementStubs,
  TooltipLabel: TooltipLabelStub,
  HashForm: HashFormStub,
  CertificateStateEditor: CertificateStateEditorStub,
  CertificateExtensionsEditor: CertificateExtensionsEditorStub,
}

function createWrapper(props = {}) {
  return mount(CertificatePropertiesEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('CertificatePropertiesEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.certificate-props').exists()).toBe(true)
    })

    it('renders all text input fields', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('component.cryptoProperties.certificateProperties.subjectName')
      expect(text).toContain('component.cryptoProperties.certificateProperties.issuerName')
      expect(text).toContain('component.cryptoProperties.certificateProperties.serialNumber')
      expect(text).toContain('component.cryptoProperties.certificateProperties.certificateFormat')
      expect(text).toContain('component.cryptoProperties.certificateProperties.certificateFileExtension')
    })

    it('renders all date fields', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('component.cryptoProperties.certificateProperties.notValidBefore')
      expect(text).toContain('component.cryptoProperties.certificateProperties.notValidAfter')
      expect(text).toContain('component.cryptoProperties.certificateProperties.creationDate')
      expect(text).toContain('component.cryptoProperties.certificateProperties.activationDate')
      expect(text).toContain('component.cryptoProperties.certificateProperties.deactivationDate')
      expect(text).toContain('component.cryptoProperties.certificateProperties.revocationDate')
      expect(text).toContain('component.cryptoProperties.certificateProperties.destructionDate')
    })

    it('renders HashForm sub-component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.hash-form-stub').exists()).toBe(true)
    })

    it('renders CertificateStateEditor sub-component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.cert-state-stub').exists()).toBe(true)
    })

    it('renders CertificateExtensionsEditor sub-component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.cert-ext-stub').exists()).toBe(true)
    })

    it('has 12 form items for text/date inputs', () => {
      const wrapper = createWrapper()
      const formItems = wrapper.findAll('.el-form-item')
      // 5 text + 7 date = 12
      expect(formItems.length).toBe(12)
    })
  })

  describe('updateField', () => {
    it('updates a string field', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateField('subjectName', 'CN=example.com')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ subjectName: 'CN=example.com' })
    })

    it('removes empty string fields', () => {
      const wrapper = createWrapper({
        modelValue: { subjectName: 'old', issuerName: 'issuer' },
      })
      ;(wrapper.vm as any).updateField('subjectName', '')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ issuerName: 'issuer' })
    })

    it('removes null fields', () => {
      const wrapper = createWrapper({ modelValue: { subjectName: 'test' } })
      ;(wrapper.vm as any).updateField('subjectName', null)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('removes undefined fields', () => {
      const wrapper = createWrapper({ modelValue: { subjectName: 'test' } })
      ;(wrapper.vm as any).updateField('subjectName', undefined)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('preserves other fields', () => {
      const wrapper = createWrapper({
        modelValue: { subjectName: 'CN=a', issuerName: 'CN=b', serialNumber: '123' },
      })
      ;(wrapper.vm as any).updateField('issuerName', 'CN=c')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ subjectName: 'CN=a', issuerName: 'CN=c', serialNumber: '123' })
    })

    it('handles undefined modelValue', () => {
      const wrapper = createWrapper()
      ;(wrapper.vm as any).updateField('subjectName', 'CN=test')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ subjectName: 'CN=test' })
    })
  })

  describe('prop passing', () => {
    it('passes all text fields to inputs', () => {
      const mv = {
        subjectName: 'CN=example.com',
        issuerName: 'CN=ca.example.com',
        serialNumber: 'AB:CD:EF',
        certificateFormat: 'X.509',
        certificateFileExtension: '.pem',
      }
      const wrapper = createWrapper({ modelValue: mv })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs[0].props('modelValue')).toBe('CN=example.com')
      expect(inputs[1].props('modelValue')).toBe('CN=ca.example.com')
      expect(inputs[2].props('modelValue')).toBe('AB:CD:EF')
      expect(inputs[3].props('modelValue')).toBe('X.509')
      expect(inputs[4].props('modelValue')).toBe('.pem')
    })

    it('passes date fields to inputs', () => {
      const mv = {
        notValidBefore: '2024-01-01T00:00:00Z',
        notValidAfter: '2025-12-31T23:59:59Z',
        creationDate: '2024-01-01T00:00:00Z',
      }
      const wrapper = createWrapper({ modelValue: mv })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs[5].props('modelValue')).toBe('2024-01-01T00:00:00Z')
      expect(inputs[6].props('modelValue')).toBe('2025-12-31T23:59:59Z')
      expect(inputs[7].props('modelValue')).toBe('2024-01-01T00:00:00Z')
    })

    it('passes fingerprint to HashForm', () => {
      const fingerprint = { alg: 'SHA-256', content: 'abc123' }
      const wrapper = createWrapper({ modelValue: { fingerprint } })
      const hashForm = wrapper.findComponent({ name: 'HashForm' })
      expect(hashForm.props('modelValue')).toEqual(fingerprint)
    })

    it('passes certificateState to CertificateStateEditor', () => {
      const certState = [{ state: 'active' }]
      const wrapper = createWrapper({ modelValue: { certificateState: certState } })
      const stateEditor = wrapper.findComponent({ name: 'CertificateStateEditor' })
      expect(stateEditor.props('modelValue')).toEqual(certState)
    })

    it('passes certificateExtensions to CertificateExtensionsEditor', () => {
      const extensions = [{ commonExtensionName: 'keyUsage', commonExtensionValue: 'sign' }]
      const wrapper = createWrapper({ modelValue: { certificateExtensions: extensions } })
      const extEditor = wrapper.findComponent({ name: 'CertificateExtensionsEditor' })
      expect(extEditor.props('modelValue')).toEqual(extensions)
    })
  })

  describe('sub-component events', () => {
    it('handles HashForm update', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const hashForm = wrapper.findComponent({ name: 'HashForm' })
      await hashForm.vm.$emit('update:modelValue', { alg: 'SHA-256', content: 'xyz' })
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ fingerprint: { alg: 'SHA-256', content: 'xyz' } })
    })

    it('handles CertificateStateEditor update', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const stateEditor = wrapper.findComponent({ name: 'CertificateStateEditor' })
      await stateEditor.vm.$emit('update:modelValue', [{ state: 'active' }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ certificateState: [{ state: 'active' }] })
    })

    it('handles CertificateExtensionsEditor update', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const extEditor = wrapper.findComponent({ name: 'CertificateExtensionsEditor' })
      await extEditor.vm.$emit('update:modelValue', [{ commonExtensionName: 'keyUsage' }])
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ certificateExtensions: [{ commonExtensionName: 'keyUsage' }] })
    })
  })

  describe('template event handlers', () => {
    it('handles subjectName input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[0].vm.$emit('update:modelValue', 'CN=test')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ subjectName: 'CN=test' })
    })

    it('handles issuerName input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].vm.$emit('update:modelValue', 'CN=issuer')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ issuerName: 'CN=issuer' })
    })

    it('handles serialNumber input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[2].vm.$emit('update:modelValue', 'AB:CD')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ serialNumber: 'AB:CD' })
    })

    it('handles certificateFormat input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[3].vm.$emit('update:modelValue', 'X.509')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ certificateFormat: 'X.509' })
    })

    it('handles certificateFileExtension input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[4].vm.$emit('update:modelValue', '.pem')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ certificateFileExtension: '.pem' })
    })

    it('handles notValidBefore date change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[5].vm.$emit('update:modelValue', '2024-01-01T00:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ notValidBefore: '2024-01-01T00:00:00Z' })
    })

    it('handles notValidAfter date change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[6].vm.$emit('update:modelValue', '2025-12-31T23:59:59Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ notValidAfter: '2025-12-31T23:59:59Z' })
    })

    it('handles creationDate change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[7].vm.$emit('update:modelValue', '2024-01-01T00:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ creationDate: '2024-01-01T00:00:00Z' })
    })

    it('handles activationDate change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[8].vm.$emit('update:modelValue', '2024-01-01T00:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ activationDate: '2024-01-01T00:00:00Z' })
    })

    it('handles deactivationDate change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[9].vm.$emit('update:modelValue', '2025-12-31T23:59:59Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ deactivationDate: '2025-12-31T23:59:59Z' })
    })

    it('handles revocationDate change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[10].vm.$emit('update:modelValue', '2025-06-15T12:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ revocationDate: '2025-06-15T12:00:00Z' })
    })

    it('handles destructionDate change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[11].vm.$emit('update:modelValue', '2026-01-01T00:00:00Z')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ destructionDate: '2026-01-01T00:00:00Z' })
    })
  })

  describe('no deprecated fields', () => {
    it('does not render deprecated certificateExtension (singular) field', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      // Should have certificateExtensions (plural) via sub-component, but no singular certificateExtension field
      expect(text).not.toContain('certificateExtension ')
    })

    it('does not render deprecated signatureAlgorithmRef', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).not.toContain('signatureAlgorithmRef')
    })

    it('does not render deprecated subjectPublicKeyRef', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).not.toContain('subjectPublicKeyRef')
    })
  })
})
