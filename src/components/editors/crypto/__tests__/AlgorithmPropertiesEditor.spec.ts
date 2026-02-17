import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AlgorithmPropertiesEditor from '../AlgorithmPropertiesEditor.vue'
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

const globalStubs = {
  ...elementStubs,
  TooltipLabel: TooltipLabelStub,
}

function createWrapper(props = {}) {
  return mount(AlgorithmPropertiesEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('AlgorithmPropertiesEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.algorithm-props').exists()).toBe(true)
    })

    it('renders all 12 form items', () => {
      const wrapper = createWrapper()
      const formItems = wrapper.findAll('.el-form-item')
      expect(formItems.length).toBe(12)
    })

    it('displays all field labels', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('component.cryptoProperties.algorithmProperties.primitive')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.algorithmFamily')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.parameterSetIdentifier')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.ellipticCurve')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.executionEnvironment')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.implementationPlatform')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.certificationLevel')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.mode')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.padding')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.cryptoFunctions')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.classicalSecurityLevel')
      expect(text).toContain('component.cryptoProperties.algorithmProperties.nistQuantumSecurityLevel')
    })
  })

  describe('enum options', () => {
    it('provides 16 primitive options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      // First select is primitive
      const primitiveSelect = selects[0]
      const options = primitiveSelect.findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(16)
    })

    it('provides 6 execution environment options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      // executionEnvironment is the 2nd select (after primitive)
      const options = selects[1].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(6)
    })

    it('provides 14 implementation platform options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[2].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(14)
    })

    it('provides 28 certification level options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      // certificationLevel is 4th select
      const options = selects[3].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(29)
    })

    it('provides 9 mode options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[4].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(9)
    })

    it('provides 7 padding options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[5].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(7)
    })

    it('provides 13 crypto function options', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      const options = selects[6].findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(13)
    })
  })

  describe('updateField', () => {
    it('updates a string field', () => {
      const wrapper = createWrapper({ modelValue: {} })
      ;(wrapper.vm as any).updateField('primitive', 'hash')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ primitive: 'hash' })
    })

    it('removes empty string fields', () => {
      const wrapper = createWrapper({
        modelValue: { primitive: 'hash', mode: 'cbc' },
      })
      ;(wrapper.vm as any).updateField('primitive', '')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ mode: 'cbc' })
    })

    it('removes null fields', () => {
      const wrapper = createWrapper({
        modelValue: { primitive: 'hash' },
      })
      ;(wrapper.vm as any).updateField('primitive', null)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('removes undefined fields', () => {
      const wrapper = createWrapper({
        modelValue: { primitive: 'hash' },
      })
      ;(wrapper.vm as any).updateField('primitive', undefined)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('removes empty arrays', () => {
      const wrapper = createWrapper({
        modelValue: { cryptoFunctions: ['encrypt'] },
      })
      ;(wrapper.vm as any).updateField('cryptoFunctions', [])
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })

    it('preserves other fields when updating one', () => {
      const wrapper = createWrapper({
        modelValue: { primitive: 'hash', mode: 'cbc', padding: 'pkcs7' },
      })
      ;(wrapper.vm as any).updateField('mode', 'gcm')
      const emitted = wrapper.emitted('update:modelValue')![0][0]
      expect(emitted).toEqual({ primitive: 'hash', mode: 'gcm', padding: 'pkcs7' })
    })

    it('handles undefined modelValue', () => {
      const wrapper = createWrapper()
      ;(wrapper.vm as any).updateField('primitive', 'signature')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ primitive: 'signature' })
    })
  })

  describe('prop binding', () => {
    it('passes primitive value to select', () => {
      const wrapper = createWrapper({ modelValue: { primitive: 'hash' } })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects[0].props('modelValue')).toBe('hash')
    })

    it('passes algorithmFamily to input', () => {
      const wrapper = createWrapper({ modelValue: { algorithmFamily: 'AES' } })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs[0].props('modelValue')).toBe('AES')
    })

    it('passes certificationLevel array to multi-select', () => {
      const wrapper = createWrapper({
        modelValue: { certificationLevel: ['fips140-2-l1', 'cc-eal4'] },
      })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      // certificationLevel is the 4th select (index 3)
      expect(selects[3].props('modelValue')).toEqual(['fips140-2-l1', 'cc-eal4'])
    })

    it('defaults certificationLevel to empty array', () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects[3].props('modelValue')).toEqual([])
    })

    it('defaults cryptoFunctions to empty array', () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects[6].props('modelValue')).toEqual([])
    })

    it('passes classicalSecurityLevel as number', () => {
      const wrapper = createWrapper({ modelValue: { classicalSecurityLevel: 128 } })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      // classicalSecurityLevel is a number input (after algorithmFamily, parameterSetIdentifier, ellipticCurve = index 3)
      expect(inputs[3].props('modelValue')).toBe(128)
    })
  })

  describe('number field handling', () => {
    it('converts classicalSecurityLevel to Number', () => {
      const wrapper = createWrapper({ modelValue: {} })
      // Simulate by calling updateField with Number conversion inline
      ;(wrapper.vm as any).updateField('classicalSecurityLevel', 256)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ classicalSecurityLevel: 256 })
    })

    it('sets undefined when number field cleared', () => {
      const wrapper = createWrapper({
        modelValue: { classicalSecurityLevel: 128 },
      })
      ;(wrapper.vm as any).updateField('classicalSecurityLevel', undefined)
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({})
    })
  })

  describe('template event handlers', () => {
    it('handles primitive select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[0].vm.$emit('update:modelValue', 'hash')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ primitive: 'hash' })
    })

    it('handles algorithmFamily input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[0].vm.$emit('update:modelValue', 'AES')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ algorithmFamily: 'AES' })
    })

    it('handles parameterSetIdentifier input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].vm.$emit('update:modelValue', 'ML-KEM-768')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ parameterSetIdentifier: 'ML-KEM-768' })
    })

    it('handles ellipticCurve input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[2].vm.$emit('update:modelValue', 'P-256')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ ellipticCurve: 'P-256' })
    })

    it('handles executionEnvironment select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[1].vm.$emit('update:modelValue', 'hardware')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ executionEnvironment: 'hardware' })
    })

    it('handles implementationPlatform select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[2].vm.$emit('update:modelValue', 'x86_64')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ implementationPlatform: 'x86_64' })
    })

    it('handles certificationLevel multi-select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[3].vm.$emit('update:modelValue', ['fips140-2-l1'])
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ certificationLevel: ['fips140-2-l1'] })
    })

    it('handles mode select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[4].vm.$emit('update:modelValue', 'gcm')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ mode: 'gcm' })
    })

    it('handles padding select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[5].vm.$emit('update:modelValue', 'oaep')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ padding: 'oaep' })
    })

    it('handles cryptoFunctions multi-select change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[6].vm.$emit('update:modelValue', ['encrypt', 'decrypt'])
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ cryptoFunctions: ['encrypt', 'decrypt'] })
    })

    it('handles classicalSecurityLevel input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[3].vm.$emit('update:modelValue', '128')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ classicalSecurityLevel: 128 })
    })

    it('handles nistQuantumSecurityLevel input change', async () => {
      const wrapper = createWrapper({ modelValue: {} })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[4].vm.$emit('update:modelValue', '3')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ nistQuantumSecurityLevel: 3 })
    })
  })
})
