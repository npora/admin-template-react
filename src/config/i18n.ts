export const supportedLocales = ['zh-CN', 'en-US'] as const
export type AppLocale = (typeof supportedLocales)[number]

function resolveLocale(value: unknown, fallback: AppLocale): AppLocale {
  return value === 'zh-CN' || value === 'en-US' ? value : fallback
}

export const i18nConfig = {
  enabled: import.meta.env.VITE_I18N_ENABLED !== 'false',
  defaultLocale: resolveLocale(import.meta.env.VITE_I18N_DEFAULT_LOCALE, 'zh-CN'),
  fallbackLocale: resolveLocale(import.meta.env.VITE_I18N_FALLBACK_LOCALE, 'zh-CN'),
  detectBrowserLanguage: import.meta.env.VITE_I18N_DETECT_BROWSER_LANGUAGE === 'true',
  supportedLocales
}
