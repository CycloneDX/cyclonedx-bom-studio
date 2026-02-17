import { defineComponent } from 'vue'

/**
 * Creates a named stub component for testing.
 * This allows Vue Test Utils' findComponent({ name: 'X' }) to work correctly.
 * @param name The component name to use in tests
 * @param template The template for the stub
 * @param props Component props
 * @param emits Component emits
 */
export function createNamedStub(
  name: string,
  template: string,
  props: string[] | Record<string, any> = [],
  emits: string[] = [],
) {
  return defineComponent({
    name,
    template,
    props,
    emits,
  })
}

/**
 * Element UI (Element Plus) stubs for tests
 */
export const elementStubs = {
  ElFormItem: createNamedStub(
    'ElFormItem',
    '<div class="el-form-item"><slot name="label" /><slot /></div>',
    [],
    [],
  ),
  ElSelect: createNamedStub(
    'ElSelect',
    '<div class="el-select"><slot /></div>',
    ['modelValue', 'clearable', 'multiple', 'filterable'],
    ['update:modelValue'],
  ),
  ElOption: createNamedStub(
    'ElOption',
    '<div class="el-option" />',
    ['label', 'value'],
    [],
  ),
  ElInput: createNamedStub(
    'ElInput',
    '<div class="el-input" />',
    ['modelValue', 'placeholder', 'type', 'rows'],
    ['update:modelValue'],
  ),
  ElCheckbox: createNamedStub(
    'ElCheckbox',
    '<div class="el-checkbox" />',
    ['modelValue', 'label'],
    ['update:modelValue'],
  ),
  ElDatePicker: createNamedStub(
    'ElDatePicker',
    '<div class="el-date-picker" />',
    ['modelValue', 'type', 'placeholder'],
    ['update:modelValue'],
  ),
}
