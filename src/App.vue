<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TopBar from '@/components/layout/TopBar.vue'
import SideBar from '@/components/layout/SideBar.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import { useBomStore } from '@/stores/bomStore'
import { useUiStore } from '@/stores/uiStore'
import { useValidationStore } from '@/stores/validationStore'
import { useSignatureStore, SignatureSaveBlocked } from '@/stores/signatureStore'
import { SignKeyError, SignAlgorithmError } from '@/utils/jsfSignature'
import { ElMessage, ElMessageBox } from 'element-plus'
import { downloadBomAsJson, loadBomFromFile } from '@/utils/bomFileHandler'
import { loadLocaleMessages } from '@/i18n'

const router = useRouter()
const { locale } = useI18n()
const bomStore = useBomStore()
const uiStore = useUiStore()
const validationStore = useValidationStore()
const signatureStore = useSignatureStore()

const isRtl = computed(() => uiStore.locale === 'ar-SA')

onMounted(async () => {
  // Load user preferences
  await uiStore.loadPrefs()

  // Update locale
  locale.value = uiStore.locale

  // Create initial BOM if none exists
  if (!bomStore.bom || Object.keys(bomStore.bom).length === 0) {
    bomStore.createNewBom()
  }

  // Run initial validation and completeness
  validationStore.validateBom(bomStore.bomForExport)
  validationStore.updateCompleteness(bomStore.bom)
})

// Re-validate on every BOM change (deep watch)
watch(() => bomStore.bomForExport, (newBom) => {
  validationStore.validateBom(newBom)
  validationStore.updateCompleteness(bomStore.bom)
}, { deep: true })

// Watch locale and load new locale messages
watch(() => uiStore.locale, async (newLocale) => {
  await loadLocaleMessages(newLocale)
})

// Handle new BOM creation
const handleNewBom = () => {
  if (bomStore.isModified) {
    // In production, show a confirmation dialog
    if (!confirm('You have unsaved changes. Create new BOM anyway?')) {
      return
    }
  }
  bomStore.createNewBom()
  signatureStore.clear()
  router.push({ name: 'Dashboard' })
}

// Handle opening BOM from file
const handleOpenBom = async () => {
  try {
    const bomJson = await loadBomFromFile()
    if (bomJson) {
      // Capture signature baselines BEFORE bomStore.loadBom so the
      // baseline reflects on-disk canonical bytes. captureBaseline is
      // a no-op when the imported BOM has no signatures.
      await signatureStore.captureBaseline(bomJson)
      const result = bomStore.loadBom(bomJson)
      if (result?.converted) {
        const wasVersion = result.originalVersion
          ? `v${result.originalVersion}`
          : 'an unsupported spec version'
        ElMessage.warning({
          message: `This BOM was CycloneDX ${wasVersion}. BOM Studio supports v1.6 and v1.7 only. The BOM has been converted to v${bomStore.bom.specVersion}.`,
          duration: 6000,
          showClose: true
        })
      }
      if (signatureStore.records.length > 0) {
        const allValid = signatureStore.records.every(r => r.importVerify.valid)
        ElMessage({
          message: allValid
            ? `Detected ${signatureStore.records.length} signature(s) — all verified against their embedded keys. They will be preserved on save unless you edit a signed scope.`
            : `Detected ${signatureStore.records.length} signature(s); some failed to verify against their embedded keys. They will be preserved on save unless you edit a signed scope. See the Signatures view.`,
          type: allValid ? 'success' : 'warning',
          duration: 8000,
          showClose: true
        })
      }
      router.push({ name: 'Dashboard' })
    }
  } catch (error) {
    console.error('Error loading BOM:', error)
  }
}

// Handle saving BOM
const handleSaveBom = async () => {
  try {
    const baseExport = bomStore.bomForExport
    let toWrite: any
    // Scopes that were resigned (or freshly signed) by applyForSave.
    // Empty when the BOM was unsigned, when the user chose to strip
    // signatures, or when nothing changed since import.
    let resigned: Awaited<ReturnType<typeof signatureStore.applyForSave>>['resigned'] = []
    try {
      const result = await signatureStore.applyForSave(baseExport)
      toWrite = result.draft
      resigned = result.resigned
    } catch (e) {
      if (e instanceof SignatureSaveBlocked) {
        const action = await ElMessageBox.confirm(
          `Signed scope "${e.scopeLabel}" was modified, but no signing key is configured. Configure a key to resign, or strip signatures and save unsigned.`,
          'Signatures need attention',
          {
            confirmButtonText: 'Configure key',
            cancelButtonText: 'Strip and save unsigned',
            distinguishCancelAndClose: true,
            type: 'warning'
          }
        ).catch(reason => reason as 'cancel' | 'close')

        if (action === 'confirm') {
          router.push({ name: 'Signatures' })
          return
        }
        if (action === 'cancel') {
          // Strip every signature in the export and save unsigned.
          toWrite = stripAllSignatures(baseExport)
          ElMessage.warning('Saved without signatures. Edit invalidated the original signatures.')
        } else {
          // closed → cancel save entirely
          return
        }
      } else if (e instanceof SignKeyError || e instanceof SignAlgorithmError) {
        // PEM parse / key-algorithm mismatch / unsupported algorithm.
        // Surface the underlying message verbatim — the helpers in
        // jsfSignature.ts already format these for end users.
        ElMessage.error({
          message: e.message,
          duration: 10000,
          showClose: true,
        })
        return
      } else {
        throw e
      }
    }
    downloadBomAsJson(toWrite)
    // After a successful download, fold the just-written signatures
    // back into the in-memory BOM and into the signature store records
    // so the JSON Source view, bomForExport, and the status bar all
    // reflect the file the user just saved. Without these two calls
    // the status bar would keep reporting the import-time baseline
    // ("0/1 ok") and the next save would needlessly resign every
    // scope again.
    if (resigned.length > 0) {
      bomStore.applySignaturesAtPaths(
        resigned.map(r => ({ path: r.path, signature: (r.signedEnvelope as any).signature })),
      )
      await signatureStore.commitResigned(resigned)
    }
    bomStore.markSaved()
  } catch (error) {
    console.error('Error saving BOM:', error)
    ElMessage.error('Save failed. See console for details.')
  }
}

/**
 * Walk the export object and remove every JSF `signature` property.
 * Used as the "strip and save unsigned" fallback when the user
 * declines to configure a signing key after invalidating signatures.
 */
function stripAllSignatures(bom: any): any {
  // JSON round-trip rather than structuredClone for the same reason
  // signatureStore.applyForSave uses one: the input is a Vue reactive
  // proxy and structuredClone rejects proxy-backed arrays.
  const cloned = JSON.parse(JSON.stringify(bom))
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(visit); return }
    if ('signature' in node) delete node.signature
    for (const v of Object.values(node)) visit(v)
  }
  visit(cloned)
  return cloned
}

// Handle BOM validation
const handleValidateBom = async () => {
  validationStore.validateBom(bomStore.bomForExport)
  validationStore.updateCompleteness(bomStore.bom)
}
</script>

<template>
  <div
    class="cat-app dark-theme"
    :dir="isRtl ? 'rtl' : 'ltr'"
  >
    <TopBar
      @new-bom="handleNewBom"
      @open-bom="handleOpenBom"
      @save-bom="handleSaveBom"
      @validate-bom="handleValidateBom"
    />

    <div class="main-layout">
      <SideBar />

      <main class="main-content">
        <div class="content-wrapper">
          <!--
            Order matters: <Suspense> must be the OUTER element, not
            inside a `<router-view v-slot>`. Vue Router 5's v-slot
            renderer feeds extra bookkeeping vnodes (transition
            placeholder + matched component) into whatever it wraps,
            which trips Vue's "<Suspense> slots expect a single root
            node" warning when <Suspense> is the wrappee. Putting
            <router-view> as the single child of <Suspense> keeps the
            default slot to one vnode per navigation while still using
            <Suspense> to drive the lazy-route fallback spinner.
          -->
          <Suspense>
            <router-view />
            <template #fallback>
              <ViewSpinner />
            </template>
          </Suspense>
        </div>
      </main>
    </div>

    <StatusBar />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins' as *;

.cat-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: $bg-app;
  color: $text-primary;
  font-family: $font-sans;
  font-size: $text-base;
  overflow: hidden;

  &.dark-theme {
    background: $bg-app;
    color: $text-primary;
  }
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  padding: $space-6;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
