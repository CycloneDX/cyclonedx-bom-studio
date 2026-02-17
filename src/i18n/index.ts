import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US.json'

export const AVAILABLE_LOCALES = [
  { code: 'en-US', name: 'English', nativeName: 'English', direction: 'ltr' as const },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', direction: 'ltr' as const },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', direction: 'ltr' as const },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', direction: 'ltr' as const },
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', direction: 'ltr' as const },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' as const },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr' as const },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', direction: 'ltr' as const },
]

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: { 'en-US': enUS },
  missingWarn: false,
  fallbackWarn: false,
  globalInjection: true,
})

export async function loadLocaleMessages(locale: string) {
  if ((i18n.global.availableLocales as string[]).includes(locale)) {
    ;(i18n.global.locale as any).value = locale
    return
  }
  try {
    const messages = await import(`./locales/${locale}.json`)
    i18n.global.setLocaleMessage(locale, messages.default)
    ;(i18n.global.locale as any).value = locale
  } catch (e) {
    console.warn(`Failed to load locale ${locale}`, e)
  }
}

export default i18n
