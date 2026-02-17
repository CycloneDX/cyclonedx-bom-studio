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
import { ElMessage } from 'element-plus'
import { downloadBomAsJson, loadBomFromFile } from '@/utils/bomFileHandler'
import { loadLocaleMessages } from '@/i18n'

const router = useRouter()
const { locale } = useI18n()
const bomStore = useBomStore()
const uiStore = useUiStore()
const validationStore = useValidationStore()

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
  router.push({ name: 'Dashboard' })
}

// Handle opening BOM from file
const handleOpenBom = async () => {
  try {
    const bomJson = await loadBomFromFile()
    if (bomJson) {
      const result = bomStore.loadBom(bomJson)
      if (result?.converted) {
        ElMessage.warning({
          message: `This BOM was CycloneDX v${result.originalVersion}. BOM Studio only supports v1.6 and v1.7. The BOM has been converted to v1.7.`,
          duration: 6000,
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
const handleSaveBom = () => {
  try {
    const bomForExport = bomStore.bomForExport
    downloadBomAsJson(bomForExport)
    bomStore.markSaved()
  } catch (error) {
    console.error('Error saving BOM:', error)
  }
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
          <router-view v-slot="{ Component }">
            <Suspense>
              <template #default>
                <component :is="Component" />
              </template>
              <template #fallback>
                <ViewSpinner />
              </template>
            </Suspense>
          </router-view>
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
