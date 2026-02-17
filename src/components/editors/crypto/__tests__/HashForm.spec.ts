import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import HashForm from '../HashForm.vue'
import { elementStubs } from '@/__tests__/testHelpers'

// Setup mocks
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const globalStubs = {
  ...elementStubs,
}

function createWrapper(props = {}) {
  return mount(HashForm, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('HashForm', () => {
  describe('rendering', () => {
    it('renders without modelValue', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.hash-form').exists()).toBe(true)
    })

    it('renders with modelValue', () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-256', content: 'abc123' },
      })
      expect(wrapper.find('.hash-form').exists()).toBe(true)
    })

    it('renders custom label when provided', () => {
      const wrapper = createWrapper({ label: 'Custom Label' })
      expect(wrapper.text()).toContain('Custom Label')
    })

    it('renders default label from i18n when no label provided', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.common.fingerprintAlg')
    })

    it('renders fingerprint content label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('component.cryptoProperties.common.fingerprintContent')
    })
  })

  describe('algorithm select', () => {
    it('passes modelValue.alg to the select', () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-512', content: '' },
      })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      expect(select.props('modelValue')).toBe('SHA-512')
    })

    it('renders all 14 algorithm options', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(14)
    })

    it('emits update when algorithm changes', async () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'MD5', content: 'test' },
      })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', 'SHA-256')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        alg: 'SHA-256',
        content: 'test',
      })
    })

    it('removes alg field when cleared', async () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-256', content: 'test' },
      })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', '')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        content: 'test',
      })
    })
  })

  describe('content input', () => {
    it('passes modelValue.content to the input', () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-256', content: 'fingerprint-value' },
      })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs[0].props('modelValue')).toBe('fingerprint-value')
    })

    it('emits update when content changes', async () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-256', content: '' },
      })
      const input = wrapper.findComponent({ name: 'ElInput' })
      await input.vm.$emit('update:modelValue', 'new-content')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        alg: 'SHA-256',
        content: 'new-content',
      })
    })

    it('removes content field when emptied', async () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-256', content: 'old' },
      })
      const input = wrapper.findComponent({ name: 'ElInput' })
      await input.vm.$emit('update:modelValue', '')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        alg: 'SHA-256',
      })
    })
  })

  describe('empty state handling', () => {
    it('emits undefined when both fields are empty', async () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'SHA-256' },
      })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', '')
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })

    it('emits undefined when clearing only populated field (alg)', async () => {
      const wrapper = createWrapper({
        modelValue: { alg: 'MD5' },
      })
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', null)
      expect(wrapper.emitted('update:modelValue')![0][0]).toBeUndefined()
    })

    it('handles null modelValue gracefully', () => {
      const wrapper = createWrapper({ modelValue: null })
      expect(wrapper.find('.hash-form').exists()).toBe(true)
    })

    it('handles undefined modelValue gracefully', () => {
      const wrapper = createWrapper({ modelValue: undefined })
      expect(wrapper.find('.hash-form').exists()).toBe(true)
    })

    it('creates new object when modelValue is undefined and field set', async () => {
      const wrapper = createWrapper({})
      const input = wrapper.findComponent({ name: 'ElInput' })
      await input.vm.$emit('update:modelValue', 'new-content')
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({
        content: 'new-content',
      })
    })
  })
})
