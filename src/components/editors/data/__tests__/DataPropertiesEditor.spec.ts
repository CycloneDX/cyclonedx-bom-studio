import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataPropertiesEditor from '../DataPropertiesEditor.vue'
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

const SensitiveDataEditorStub = createNamedStub(
  'SensitiveDataEditor',
  '<div class="sensitive-data-stub" />',
  { modelValue: null },
  ['update:modelValue'],
)

const DataGovernanceEditorStub = createNamedStub(
  'DataGovernanceEditor',
  '<div class="governance-stub" />',
  { modelValue: null },
  ['update:modelValue'],
)

const globalStubs = {
  ...elementStubs,
  TooltipLabel: TooltipLabelStub,
  SensitiveDataEditor: SensitiveDataEditorStub,
  DataGovernanceEditor: DataGovernanceEditorStub,
}

function createWrapper(props = {}) {
  return mount(DataPropertiesEditor, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('DataPropertiesEditor', () => {
  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.data-props').exists()).toBe(true)
    })

    it('renders all field labels', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('component.dataSection.dataType')
      expect(text).toContain('component.dataSection.dataName')
      expect(text).toContain('component.dataSection.description')
      expect(text).toContain('component.dataSection.classification')
      expect(text).toContain('component.dataSection.contentsUrl')
      expect(text).toContain('component.dataSection.attachmentContentType')
      expect(text).toContain('component.dataSection.attachmentEncoding')
      expect(text).toContain('component.dataSection.attachmentContent')
    })

    it('renders SensitiveDataEditor', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.sensitive-data-stub').exists()).toBe(true)
    })

    it('renders DataGovernanceEditor', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.governance-stub').exists()).toBe(true)
    })

    it('provides 5 data type options', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAllComponents({ name: 'ElOption' })
      // 5 data types + 1 encoding option (base64) = need to check first select
      const firstSelect = wrapper.findAllComponents({ name: 'ElSelect' })[0]
      const typeOptions = firstSelect.findAllComponents({ name: 'ElOption' })
      expect(typeOptions.length).toBe(5)
    })

    it('includes expected data types', () => {
      const wrapper = createWrapper()
      const firstSelect = wrapper.findAllComponents({ name: 'ElSelect' })[0]
      const options = firstSelect.findAllComponents({ name: 'ElOption' })
      const values = options.map(o => o.props('value'))
      expect(values).toEqual(['source-code', 'configuration', 'dataset', 'definition', 'other'])
    })
  })

  describe('firstData computed', () => {
    it('returns first element when array has items', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', name: 'Test' }],
      })
      expect((wrapper.vm as any).firstData).toEqual({ type: 'dataset', name: 'Test' })
    })

    it('returns undefined for empty array', () => {
      const wrapper = createWrapper({ modelValue: [] })
      expect((wrapper.vm as any).firstData).toBeUndefined()
    })

    it('returns undefined when modelValue is undefined', () => {
      const wrapper = createWrapper()
      expect((wrapper.vm as any).firstData).toBeUndefined()
    })

    it('returns undefined when modelValue is not array', () => {
      const wrapper = createWrapper({ modelValue: 'not-array' })
      expect((wrapper.vm as any).firstData).toBeUndefined()
    })
  })

  describe('updateData', () => {
    it('updates field on first data entry', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset' }],
      })
      ;(wrapper.vm as any).updateData('name', 'New Name')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0]).toEqual({ type: 'dataset', name: 'New Name' })
    })

    it('removes empty string fields', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', name: 'old' }],
      })
      ;(wrapper.vm as any).updateData('name', '')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0]).toEqual({ type: 'dataset' })
    })

    it('creates new array entry when empty', () => {
      const wrapper = createWrapper({ modelValue: [] })
      ;(wrapper.vm as any).updateData('type', 'configuration')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toEqual({ type: 'configuration' })
    })

    it('creates array when modelValue is undefined', () => {
      const wrapper = createWrapper()
      ;(wrapper.vm as any).updateData('type', 'source-code')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toEqual({ type: 'source-code' })
    })

    it('preserves additional array entries', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset' }, { type: 'other' }],
      })
      ;(wrapper.vm as any).updateData('name', 'First')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted).toHaveLength(2)
      expect(emitted[0]).toEqual({ type: 'dataset', name: 'First' })
      expect(emitted[1]).toEqual({ type: 'other' })
    })
  })

  describe('updateContents', () => {
    it('sets contents.url', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset' }],
      })
      ;(wrapper.vm as any).updateContents('url', 'https://example.com/data.csv')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents).toEqual({ url: 'https://example.com/data.csv' })
    })

    it('removes empty contents field', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', contents: { url: 'old' } }],
      })
      ;(wrapper.vm as any).updateContents('url', '')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0]).not.toHaveProperty('contents')
    })

    it('preserves other contents fields', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', contents: { url: 'old', attachment: { content: 'data' } } }],
      })
      ;(wrapper.vm as any).updateContents('url', 'new-url')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents).toEqual({ url: 'new-url', attachment: { content: 'data' } })
    })
  })

  describe('updateAttachment', () => {
    it('sets attachment field', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset' }],
      })
      ;(wrapper.vm as any).updateAttachment('contentType', 'text/csv')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents.attachment).toEqual({ contentType: 'text/csv' })
    })

    it('removes empty attachment when all fields cleared', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', contents: { attachment: { contentType: 'text/csv' } } }],
      })
      ;(wrapper.vm as any).updateAttachment('contentType', '')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      // contents should be removed since attachment is empty and no other contents fields
      expect(emitted[0]).not.toHaveProperty('contents')
    })

    it('preserves other attachment fields', () => {
      const wrapper = createWrapper({
        modelValue: [{
          type: 'dataset',
          contents: {
            attachment: { contentType: 'text/csv', encoding: 'base64', content: 'data' },
          },
        }],
      })
      ;(wrapper.vm as any).updateAttachment('contentType', 'application/json')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents.attachment).toEqual({
        contentType: 'application/json',
        encoding: 'base64',
        content: 'data',
      })
    })
  })

  describe('prop passing', () => {
    it('passes type to select', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'configuration' }],
      })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects[0].props('modelValue')).toBe('configuration')
    })

    it('passes name to input', () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', name: 'Test Data' }],
      })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      expect(inputs[0].props('modelValue')).toBe('Test Data')
    })

    it('passes sensitiveData to SensitiveDataEditor', () => {
      const sensitive = ['PII', 'PHI']
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', sensitiveData: sensitive }],
      })
      const editor = wrapper.findComponent({ name: 'SensitiveDataEditor' })
      expect(editor.props('modelValue')).toEqual(sensitive)
    })

    it('passes governance to DataGovernanceEditor', () => {
      const governance = { owners: [{ contact: { name: 'Alice' } }] }
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset', governance }],
      })
      const editor = wrapper.findComponent({ name: 'DataGovernanceEditor' })
      expect(editor.props('modelValue')).toEqual(governance)
    })
  })

  describe('sub-component events', () => {
    it('handles SensitiveDataEditor update', async () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset' }],
      })
      const editor = wrapper.findComponent({ name: 'SensitiveDataEditor' })
      await editor.vm.$emit('update:modelValue', ['PII'])
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].sensitiveData).toEqual(['PII'])
    })

    it('handles DataGovernanceEditor update', async () => {
      const wrapper = createWrapper({
        modelValue: [{ type: 'dataset' }],
      })
      const editor = wrapper.findComponent({ name: 'DataGovernanceEditor' })
      const gov = { owners: [{ contact: { name: 'New' } }] }
      await editor.vm.$emit('update:modelValue', gov)
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].governance).toEqual(gov)
    })
  })

  describe('encoding options', () => {
    it('provides base64 encoding option', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      // Second select is encoding
      const encodingSelect = selects[1]
      const options = encodingSelect.findAllComponents({ name: 'ElOption' })
      expect(options.length).toBe(1)
      expect(options[0].props('value')).toBe('base64')
    })
  })

  describe('template event handlers', () => {
    it('handles type select change', async () => {
      const wrapper = createWrapper({ modelValue: [{}] })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[0].vm.$emit('update:modelValue', 'dataset')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].type).toBe('dataset')
    })

    it('handles name input change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[0].vm.$emit('update:modelValue', 'Test Data')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].name).toBe('Test Data')
    })

    it('handles description textarea change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[1].vm.$emit('update:modelValue', 'A description')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].description).toBe('A description')
    })

    it('handles classification input change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[2].vm.$emit('update:modelValue', 'confidential')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].classification).toBe('confidential')
    })

    it('handles contents url input change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[3].vm.$emit('update:modelValue', 'https://example.com')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents.url).toBe('https://example.com')
    })

    it('handles attachment contentType input change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[4].vm.$emit('update:modelValue', 'text/csv')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents.attachment.contentType).toBe('text/csv')
    })

    it('handles encoding select change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      await selects[1].vm.$emit('update:modelValue', 'base64')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents.attachment.encoding).toBe('base64')
    })

    it('handles attachment content textarea change', async () => {
      const wrapper = createWrapper({ modelValue: [{ type: 'dataset' }] })
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      await inputs[5].vm.$emit('update:modelValue', 'SGVsbG8=')
      const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
      expect(emitted[0].contents.attachment.content).toBe('SGVsbG8=')
    })
  })
})
