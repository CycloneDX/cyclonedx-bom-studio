import { ref, watch } from 'vue'
import { useBomStore } from '@/stores/bomStore'

const AUTOSAVE_KEY = 'cat_bom_autosave'
const AUTOSAVE_INTERVAL = 30000 // 30 seconds
const MAX_AUTOSAVE_SIZE = 10 * 1024 * 1024 // 10 MB limit for auto-save data

export function useAutoSave() {
  const bomStore = useBomStore()
  const isAutoSavingEnabled = ref(true)
  const lastAutoSaveTime = ref<number | null>(null)
  const autoSaveError = ref<string | null>(null)

  /**
   * Save BOM to sessionStorage for auto-recovery
   */
  function saveToSessionStorage() {
    try {
      if (!isAutoSavingEnabled.value) return

      const data = {
        bom: bomStore.bom,
        timestamp: Date.now(),
        fileName: bomStore.fileName
      }

      const serialized = JSON.stringify(data)
      // Enforce size limit to prevent storage abuse
      if (serialized.length > MAX_AUTOSAVE_SIZE) {
        autoSaveError.value = 'Auto-save skipped: BOM data exceeds size limit'
        return
      }

      sessionStorage.setItem(AUTOSAVE_KEY, serialized)
      lastAutoSaveTime.value = Date.now()
      autoSaveError.value = null
    } catch (error) {
      autoSaveError.value = `Auto-save failed: ${error}`
      console.error('Auto-save error:', error)
    }
  }

  /**
   * Load BOM from sessionStorage (for recovery)
   */
  function loadFromSessionStorage(): any | null {
    try {
      const data = sessionStorage.getItem(AUTOSAVE_KEY)
      if (!data) return null

      const parsed = JSON.parse(data)
      // Validate basic structure before returning
      if (!parsed || typeof parsed !== 'object' || !parsed.bom) return null
      if (typeof parsed.timestamp !== 'number') return null

      return {
        bom: parsed.bom,
        timestamp: parsed.timestamp,
        fileName: typeof parsed.fileName === 'string' ? parsed.fileName : ''
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error)
      return null
    }
  }

  /**
   * Clear auto-saved BOM from sessionStorage
   */
  function clearAutoSave() {
    try {
      sessionStorage.removeItem(AUTOSAVE_KEY)
      lastAutoSaveTime.value = null
    } catch (error) {
      console.error('Failed to clear auto-save:', error)
    }
  }

  /**
   * Check if auto-saved BOM exists
   */
  function hasAutoSave(): boolean {
    try {
      return !!sessionStorage.getItem(AUTOSAVE_KEY)
    } catch {
      return false
    }
  }

  /**
   * Get auto-save timestamp
   */
  function getAutoSaveTimestamp(): Date | null {
    try {
      const data = sessionStorage.getItem(AUTOSAVE_KEY)
      if (!data) return null
      const parsed = JSON.parse(data)
      if (typeof parsed.timestamp !== 'number') return null
      return new Date(parsed.timestamp)
    } catch {
      return null
    }
  }

  /**
   * Toggle auto-save on/off
   */
  function toggleAutoSave() {
    isAutoSavingEnabled.value = !isAutoSavingEnabled.value
    if (isAutoSavingEnabled.value) {
      saveToSessionStorage()
    }
  }

  /**
   * Setup watchers for auto-save
   */
  function setupAutoSave() {
    // Watch BOM changes
    watch(
      () => bomStore.bom,
      () => {
        saveToSessionStorage()
      },
      { deep: true }
    )

    // Watch fileName changes
    watch(
      () => bomStore.fileName,
      () => {
        saveToSessionStorage()
      }
    )

    // Initial save
    saveToSessionStorage()
  }

  /**
   * Cleanup auto-save (called on component unmount)
   */
  function cleanupAutoSave() {
    // Save one final time before cleanup
    saveToSessionStorage()
  }

  return {
    isAutoSavingEnabled,
    lastAutoSaveTime,
    autoSaveError,
    saveToSessionStorage,
    loadFromSessionStorage,
    clearAutoSave,
    hasAutoSave,
    getAutoSaveTimestamp,
    toggleAutoSave,
    setupAutoSave,
    cleanupAutoSave
  }
}
