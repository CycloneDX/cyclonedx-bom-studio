import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'cat_ui_prefs'

// Whitelist of allowed locale codes
const ALLOWED_LOCALES = ['en-US', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP', 'zh-CN', 'pt-BR']

export const useUiStore = defineStore('ui', () => {
  const locale = ref('en-US')
  const sidebarCollapsed = ref(false)

  function setLocale(l: string) {
    // Validate locale against whitelist
    if (ALLOWED_LOCALES.includes(l)) {
      locale.value = l
    }
    savePrefs()
  }

  function toggleSidebar() { sidebarCollapsed.value = !sidebarCollapsed.value; savePrefs() }

  function savePrefs() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: locale.value, sidebarCollapsed: sidebarCollapsed.value }))
    } catch {}
  }

  function loadPrefs() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (typeof p.locale === 'string' && ALLOWED_LOCALES.includes(p.locale)) {
          locale.value = p.locale
        }
        if (typeof p.sidebarCollapsed === 'boolean') sidebarCollapsed.value = p.sidebarCollapsed
      }
    } catch {}
  }

  return { locale, sidebarCollapsed, setLocale, toggleSidebar, savePrefs, loadPrefs }
})
