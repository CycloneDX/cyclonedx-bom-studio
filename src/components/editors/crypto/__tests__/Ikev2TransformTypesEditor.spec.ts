import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Ikev2TransformTypesEditor from '../Ikev2TransformTypesEditor.vue'
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

const ElSwitchStub = createNamedStub(
  'ElSwitch',
  '<div class="el-switch" />',
  { modelValue: Boolean },
  ['update:modelValue'],
)

const globalStubs = {
  ...elementStubs,
  ElSwitch: ElSwitchStub,
  TooltipLabel: TooltipLabelStub,
}

function createWrapper(props = {}) {
  return mount(Ikev2TransformTypesEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('Ikev2TransformTypesEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.ikev2-editor').exists()).toBe(true)
    })

    it('renders all 5 fields (encr, prf, integ, ke, esn)', () => {
      const wrapper = createWrapper()
      const formItems = wrapper.findAll('.el-form-item')
      expect(formItems.length).toBe(5)
    })

    it('shows field labels', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('component.cryptoProperties.protocolProperties.ikev2Encr')
      expect(text).toContain('component.cryptoProperties.protocolProperties.ikev2Prf')
      expect(text).toContain('component.cryptoProperties.protocolProperties.ikev2Integ')
      expect(text).toContain('component.cryptoProperties.protocolProperties.ikev2Ke')
      expect(text).toContain('component.cryptoProperties.protocolProperties.ikev2Esn')
    })
  })

  describe('updateField', () => {
    it('updates a simple field', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateField('esn', true)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ esn: true })
    })

    it('removes empty string fields', () => {
      const wrapper = createWrapper({
        modelValue: { esn: true, encr: [{ name: 'AES' }] },
      })
      ;(wrapper.vm as any).updateField('encr', '')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ esn: true })
    })

    it('removes null fields', () => {
      const wrapper = createWrapper({
        modelValue: { esn: true },
      })
      ;(wrapper.vm as any).updateField('esn', null)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })

    it('emits undefined when all fields empty', () => {
      const wrapper = createWrapper({ modelValue: { esn: false } })
      ;(wrapper.vm as any).updateField('esn', undefined)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })

    it('handles undefined modelValue', () => {
      const wrapper = createWrapper()
      ;(wrapper.vm as any).updateField('esn', true)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ esn: true })
    })
  })

  describe('parseNameArray', () => {
    it('parses comma-separated names into objects', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseNameArray('AES-CBC, AES-GCM')
      expect(result).toEqual([{ name: 'AES-CBC' }, { name: 'AES-GCM' }])
    })

    it('trims whitespace', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseNameArray('  AES  ,  3DES  ')
      expect(result).toEqual([{ name: 'AES' }, { name: '3DES' }])
    })

    it('returns undefined for empty string', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).parseNameArray('')).toBeUndefined()
    })

    it('filters empty entries', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).parseNameArray('AES,,GCM,')
      expect(result).toEqual([{ name: 'AES' }, { name: 'GCM' }])
    })
  })

  describe('joinNameArray', () => {
    it('joins array of name objects', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).joinNameArray([{ name: 'AES' }, { name: 'GCM' }])
      expect(result).toBe('AES, GCM')
    })

    it('handles string items', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).joinNameArray(['AES', 'GCM'])
      expect(result).toBe('AES, GCM')
    })

    it('returns empty string for undefined', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).joinNameArray(undefined)).toBe('')
    })

    it('returns empty string for null', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).joinNameArray(null)).toBe('')
    })

    it('handles mixed items with empty names', () => {
      const wrapper = createWrapper()
      const result = (wrapper.vm as any).joinNameArray([{ name: 'AES' }, {}])
      expect(result).toBe('AES, ')
    })
  })

  describe('field interactions', () => {
    it('passes encr array as joined string to input', () => {
      const wrapper = createWrapper({
        modelValue: { encr: [{ name: 'AES-CBC' }, { name: 'AES-GCM' }] },
      })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs[0].props('modelValue')).toBe('AES-CBC, AES-GCM')
    })

    it('passes esn boolean to switch', () => {
      const wrapper = createWrapper({ modelValue: { esn: true } })
      const switchComp = wrapper.findComponent({ name: 'ElSwitch' })
      expect(switchComp.props('modelValue')).toBe(true)
    })

    it('defaults esn to false when not set', () => {
      const wrapper = createWrapper({ modelValue: {} })
      const switchComp = wrapper.findComponent({ name: 'ElSwitch' })
      expect(switchComp.props('modelValue')).toBe(false)
    })
  })

  describe('template event handlers', () => {
    it('handles encr input change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[0].vm.$emit('update:modelValue', 'AES-CBC, AES-GCM')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted.encr).toEqual([{ name: 'AES-CBC' }, { name: 'AES-GCM' }])
    })

    it('handles prf input change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].vm.$emit('update:modelValue', 'HMAC-SHA256')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted.prf).toEqual([{ name: 'HMAC-SHA256' }])
    })

    it('handles integ input change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[2].vm.$emit('update:modelValue', 'AUTH_HMAC_SHA2_256')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted.integ).toEqual([{ name: 'AUTH_HMAC_SHA2_256' }])
    })

    it('handles ke input change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[3].vm.$emit('update:modelValue', 'DH-14, DH-19')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted.ke).toEqual([{ name: 'DH-14' }, { name: 'DH-19' }])
    })

    it('handles esn switch change via template', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const switchComp = wrapper.findComponent({ name: 'ElSwitch' })
      await switchComp.vm.$emit('update:modelValue', true)
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted.esn).toBe(true)
    })
  })
})
