import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import MetadataEditor from '../MetadataEditor.vue'
import { createNamedStub, elementStubs } from '@/__tests__/testHelpers'

const mockBomStore = {
  bom: {
    metadata: {
      timestamp: '2026-05-18T16:40:27Z',
      authors: [{ name: 'Hanna Instruments' }],
      supplier: { name: 'Hanna Instruments' },
      manufacturer: { name: 'Hanna Instruments' },
      component: { name: 'hi6000', version: '2.4.0', type: 'application' },
      lifecycles: [{ phase: 'operations' }],
      distributionConstraints: { tlp: 'AMBER_AND_STRICT' },
      tools: {
        components: [
          { name: 'rdt version 1.0.33', version: '1.0.33', type: 'application' },
        ],
        services: [],
      },
      licenses: [
        { license: { name: '(c) 2026 Endeavor Consulting Group, LLC.' } },
      ],
      properties: [],
    },
  },
  markModified: vi.fn(),
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/stores/bomStore', () => ({
  useBomStore: () => mockBomStore,
}))

vi.mock('@/composables/useViewLoading', () => ({
  useViewLoadingAsync: async () => undefined,
  useViewLoading: () => ({ ready: true }),
}))

vi.mock('@/composables/useSpecVersionGating', () => ({
  useSpecVersionGating: () => ({ supportsDistributionConstraints: true }),
  TLP_CLASSIFICATIONS: ['CLEAR', 'GREEN', 'AMBER', 'AMBER_AND_STRICT', 'RED'],
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
  ElForm: createNamedStub('ElForm', '<div class="el-form"><slot /></div>'),
  ElButton: createNamedStub('ElButton', '<button><slot /></button>'),
  ElCheckboxGroup: createNamedStub('ElCheckboxGroup', '<div class="el-checkbox-group"><slot /></div>', ['modelValue'], ['update:modelValue']),
  ElDivider: createNamedStub('ElDivider', '<hr class="el-divider" />'),
  EditorCard: createNamedStub('EditorCard', '<div class="editor-card"><slot name="title" /><slot /></div>'),
  AddButton: createNamedStub('AddButton', '<button class="add-button" />'),
  ContactForm: createNamedStub('ContactForm', '<div class="contact-form" />'),
  OrganizationForm: createNamedStub('OrganizationForm', '<div class="organization-form" />'),
  TooltipLabel: TooltipLabelStub,
  ViewSpinner: createNamedStub('ViewSpinner', '<div class="view-spinner" />'),
}

describe('MetadataEditor', () => {
  it('renders imported tool and BOM license values', async () => {
    const TestHost = defineComponent({
      components: { MetadataEditor },
      template: '<Suspense><MetadataEditor /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: { stubs: globalStubs },
    })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('rdt version 1.0.33')
    expect(text).toContain('(c) 2026 Endeavor Consulting Group, LLC.')
  })
})
