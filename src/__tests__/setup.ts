/**
 * Global test setup for vitest
 * Mocks vue-i18n and provides shared utilities
 */
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock vue-i18n globally - returns the key as the translation
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
  createI18n: () => ({}),
}))

// Mock the bomStore used by TooltipLabel
vi.mock('@/stores/bomStore', () => ({
  useBomStore: () => ({
    bom: { specVersion: '1.6' },
  }),
}))

// Mock useSchemaTooltips composable used by TooltipLabel
vi.mock('@/composables/useSchemaTooltips', () => ({
  useSchemaTooltips: () => ({
    tooltip: () => '',
  }),
}))

// Stub Element Plus components globally
const stubComponent = (name: string) => ({
  name,
  template: '<div><slot /><slot name="default" /><slot name="label" /><slot name="reference" /></div>',
  props: {
    modelValue: { default: undefined },
    clearable: { default: false },
    multiple: { default: false },
    placeholder: { default: '' },
    type: { default: 'text' },
    rows: { default: 1 },
    min: { default: undefined },
    max: { default: undefined },
    label: { default: '' },
    value: { default: undefined },
    stripe: { default: false },
    data: { default: () => [] },
    prop: { default: '' },
    minWidth: { default: undefined },
    width: { default: undefined },
    fixed: { default: undefined },
    contentPosition: { default: '' },
    content: { default: '' },
    title: { default: '' },
    size: { default: '' },
    disabled: { default: false },
    icon: { default: undefined },
    plain: { default: false },
  },
  emits: ['update:modelValue', 'click', 'confirm'],
})

config.global.stubs = {
  ElFormItem: {
    name: 'ElFormItem',
    template: '<div class="el-form-item"><slot name="label" /><slot /></div>',
  },
  ElSelect: {
    name: 'ElSelect',
    template: '<div class="el-select"><slot /></div>',
    props: ['modelValue', 'clearable', 'multiple', 'placeholder'],
    emits: ['update:modelValue'],
  },
  ElOption: {
    name: 'ElOption',
    template: '<div class="el-option" />',
    props: ['label', 'value'],
  },
  ElInput: {
    name: 'ElInput',
    template: '<div class="el-input" />',
    props: ['modelValue', 'placeholder', 'type', 'rows', 'min', 'max'],
    emits: ['update:modelValue'],
  },
  ElTable: {
    name: 'ElTable',
    template: '<div class="el-table"><slot /></div>',
    props: ['data', 'stripe'],
  },
  ElTableColumn: {
    name: 'ElTableColumn',
    template: '<div class="el-table-column"><slot /></div>',
    props: ['label', 'prop', 'minWidth', 'width', 'fixed'],
  },
  ElDivider: {
    name: 'ElDivider',
    template: '<div class="el-divider"><slot /></div>',
    props: ['contentPosition'],
  },
  ElSwitch: {
    name: 'ElSwitch',
    template: '<div class="el-switch" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
  ElButton: stubComponent('ElButton'),
  ElPopconfirm: {
    name: 'ElPopconfirm',
    template: '<div class="el-popconfirm"><slot name="reference" /></div>',
    props: ['title'],
    emits: ['confirm'],
  },
  ElTooltip: stubComponent('ElTooltip'),
  ElIcon: stubComponent('ElIcon'),
  TooltipLabel: {
    name: 'TooltipLabel',
    template: '<span>{{ label }}</span>',
    props: ['label', 'tooltip', 'schemaPath'],
  },
  AddButton: {
    name: 'AddButton',
    template: '<button class="add-btn" @click="$emit(\'click\')">Add</button>',
    props: ['size', 'disabled', 'label'],
    emits: ['click'],
  },
  RowActions: {
    name: 'RowActions',
    template: '<div class="row-actions"><button class="delete-btn" @click="$emit(\'delete\')">Delete</button></div>',
    props: ['showEdit', 'confirmDeleteTitle'],
    emits: ['edit', 'delete'],
  },
}
