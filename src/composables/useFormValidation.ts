import { useI18n } from 'vue-i18n'

/**
 * Shared form validation composable.
 * Provides reusable validators for Element Plus form rules.
 */
export function useFormValidation() {
  const { t } = useI18n()

  /**
   * Rejects values that contain only whitespace characters.
   * Use as a validator in FormRules alongside { required: true }.
   */
  const noWhitespaceOnly = (_rule: any, value: any, callback: any) => {
    if (typeof value === 'string' && value.trim().length === 0) {
      callback(new Error(t('validation.whitespaceOnly')))
    } else {
      callback()
    }
  }

  return {
    noWhitespaceOnly
  }
}
