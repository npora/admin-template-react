import enLanguage from './en-US/language.json'
import zhLanguage from './zh-CN/language.json'
import enTimezone from './en-US/timezone.json'
import zhTimezone from './zh-CN/timezone.json'
import { i18nConfig } from '../config/i18n'
import enProfile from './en-US/profile.json'
import zhProfile from './zh-CN/profile.json'
import enDict from './en-US/dict.json'
import zhDict from './zh-CN/dict.json'
import zhAuditLog from './zh-CN/auditLog.json'
import enAuditLog from './en-US/auditLog.json'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enRoutes from './en-US/routes.json'
import enUi from './en-US/ui.json'
import zhRoutes from './zh-CN/routes.json'
import zhUi from './zh-CN/ui.json'

function savedLocale() {
  try {
    const value = localStorage.getItem('npora-react-language')
    return value === 'zh-CN' || value === 'en-US'
  } catch {
    return false
  }
}

export const i18nReady = i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [...i18nConfig.supportedLocales],
    fallbackLng: i18nConfig.fallbackLocale,
    lng: !i18nConfig.enabled || (!i18nConfig.detectBrowserLanguage && !savedLocale()) ? i18nConfig.defaultLocale : undefined,
    defaultNS: 'ui',
    ns: ['ui', 'routes', 'dict', 'profile', 'timezone', 'language', 'auditLog'],
    resources: {
      'zh-CN': { ui: zhUi, routes: zhRoutes, auditLog: zhAuditLog, language: zhLanguage, timezone: zhTimezone, profile: zhProfile, dict: zhDict },
      'en-US': { ui: enUi, routes: enRoutes, auditLog: enAuditLog, language: enLanguage, timezone: enTimezone, profile: enProfile, dict: enDict }
    },
    detection: {
      order: i18nConfig.detectBrowserLanguage ? ['localStorage', 'navigator'] : ['localStorage'],
      lookupLocalStorage: 'npora-react-language',
      caches: i18nConfig.enabled ? ['localStorage'] : [],
      convertDetectedLanguage: (language) => {
        const base = language.toLowerCase().split(/[-_]/)[0]
        if (base === 'zh') return 'zh-CN'
        if (base === 'en') return 'en-US'
        return language
      }
    },
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' }
  })
