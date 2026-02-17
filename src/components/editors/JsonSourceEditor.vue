<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElSwitch, ElMessage } from 'element-plus'
import { CopyDocument, Download } from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useValidationStore } from '@/stores/validationStore'
import EditorCard from '@/components/shared/EditorCard.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()
const validationStore = useValidationStore()

const isEditable = ref(false)
const editorContainer = ref<HTMLElement | null>(null)
let editorView: EditorView | null = null

const formattedJson = computed(() => {
  return JSON.stringify(bomStore.bomForExport, null, 2)
})

// Shared extensions for both read-only and editable modes
const baseExtensions = [
  json(),
  oneDark,
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  bracketMatching(),
  foldGutter(),
  keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
  EditorView.theme({
    '&': {
      fontSize: '13px',
      fontFamily: "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace",
    },
    '.cm-content': {
      caretColor: '#528bff',
    },
    '.cm-gutters': {
      borderRight: '1px solid #3a3f4b',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  }),
]

function createEditorState(doc: string, readOnly: boolean): EditorState {
  const extensions = [
    ...baseExtensions,
    history(),
    lintGutter(),
    EditorState.readOnly.of(readOnly),
  ]

  if (!readOnly) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          handleEditorChange(update.state.doc.toString())
        }
      })
    )
  }

  return EditorState.create({ doc, extensions })
}

function initEditor(doc: string, readOnly: boolean) {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
  if (!editorContainer.value) return

  const state = createEditorState(doc, readOnly)
  editorView = new EditorView({
    state,
    parent: editorContainer.value,
  })
}

// Track JSON validity for the footer — runs full AJV schema validation
function handleEditorChange(content: string) {
  validationStore.validateJsonText(content)
}

function getCurrentContent(): string {
  if (editorView) {
    return editorView.state.doc.toString()
  }
  return formattedJson.value
}

const handleToggleEdit = (value: string | number | boolean) => {
  if (value) {
    // Entering edit mode
    nextTick(() => {
      initEditor(formattedJson.value, false)
    })
  } else {
    // Leaving edit mode — restore read-only view with current BOM
    nextTick(() => {
      initEditor(formattedJson.value, true)
    })
    // Re-validate against the current BOM (restores normal validation state)
    validationStore.validateBom(bomStore.bomForExport)
  }
}

const handleCopy = () => {
  const content = getCurrentContent()
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success(t('common.copied'))
  })
}

const handleDownload = () => {
  const content = getCurrentContent()
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bom.json'
  a.click()
  URL.revokeObjectURL(url)
}

const handleSaveEdits = () => {
  const content = getCurrentContent()
  try {
    const parsed = JSON.parse(content)
    const result = bomStore.loadBom(parsed)
    isEditable.value = false
    nextTick(() => {
      initEditor(formattedJson.value, true)
    })
    // BOM watcher in App.vue will re-validate automatically
    if (result?.converted) {
      ElMessage.warning({
        message: `This BOM was CycloneDX v${result.originalVersion}. BOM Studio only supports v1.6 and v1.7. The BOM has been converted to v1.7.`,
        duration: 6000,
        showClose: true
      })
    } else {
      ElMessage.success(t('common.saved'))
    }
  } catch (error: any) {
    ElMessage.error(t('jsonSource.parseError') + ': ' + error.message)
  }
}

// Watch for BOM changes when in read-only mode to keep the view in sync
watch(formattedJson, (newVal) => {
  if (!isEditable.value && editorView) {
    const currentDoc = editorView.state.doc.toString()
    if (currentDoc !== newVal) {
      editorView.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: newVal },
      })
    }
  }
})

onMounted(() => {
  nextTick(() => {
    initEditor(formattedJson.value, true)
  })
})

onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})
</script>

<template>
  <div class="json-source-editor">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <EditorCard :title="t('jsonSource.title')">
        <template #header-actions>
          <div class="json-source-editor__edit-toggle">
            <span class="json-source-editor__toggle-label">{{ t('jsonSource.editMode') }}</span>
            <ElSwitch
              v-model="isEditable"
              @change="handleToggleEdit"
            />
          </div>
          <ElButton
            type="primary"
            plain
            :icon="CopyDocument"
            @click="handleCopy"
          >
            {{ t('common.copy') }}
          </ElButton>
          <ElButton
            type="primary"
            plain
            :icon="Download"
            @click="handleDownload"
          >
            {{ t('common.download') }}
          </ElButton>
          <ElButton
            v-if="isEditable"
            type="success"
            plain
            @click="handleSaveEdits"
          >
            {{ t('common.save') }}
          </ElButton>
        </template>

        <div class="json-source-editor__content">
          <div ref="editorContainer" class="json-source-editor__codemirror" />
        </div>
      </EditorCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.json-source-editor {
  width: 100%;

  &__edit-toggle {
    display: flex;
    gap: $space-2;
    align-items: center;
    padding: $space-2 $space-3;
    background-color: $bg-input;
    border-radius: $radius-sm;
    border: 1px solid $border-default;
  }

  &__toggle-label {
    font-size: $text-sm;
    color: $text-secondary;
    font-weight: $weight-medium;
  }

  &__content {
    display: flex;
    flex-direction: column;
    min-height: 400px;
    max-height: 700px;
  }

  &__codemirror {
    flex: 1;
    border: 1px solid $border-default;
    border-radius: $radius-md;
    overflow: hidden;

    :deep(.cm-editor) {
      height: 100%;
      min-height: 400px;
      max-height: 680px;
    }

    :deep(.cm-scroller) {
      overflow: auto;
    }
  }
}
</style>
