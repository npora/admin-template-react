import { createContext, useContext } from 'react'
import { TIME_ZONE } from './timezone'
import type { AppTimeZone } from './timezone'

export const accents = {
  indigo: '#4361ee', blue: '#1761b4', teal: '#117567', emerald: '#198256',
  violet: '#714fc6', rose: '#b23a66', amber: '#916008', orange: '#af4920'
}
const options = {
  mode: ['light', 'dark', 'system'],
  accent: Object.keys(accents) as (keyof typeof accents)[],
  size: ['large', 'default', 'small'],
  layout: ['sidebar', 'top', 'mixed'],
  tabStyle: ['pill', 'underline', 'card'],
  transition: ['fade', 'slide', 'none'],
  timeZone: Object.values(TIME_ZONE)
} as const
export interface Preferences {
  mode: (typeof options.mode)[number]
  accent: keyof typeof accents
  size: (typeof options.size)[number]
  layout: (typeof options.layout)[number]
  tabStyle: (typeof options.tabStyle)[number]
  transition: (typeof options.transition)[number]
  timeZone: AppTimeZone
  grayscale: boolean
  colorVision: boolean
  logo: boolean
  breadcrumbs: boolean
  tabs: boolean
  watermark: boolean
}

export const defaults: Preferences = {
  mode: 'system', accent: 'indigo', size: 'default', layout: 'sidebar',
  tabStyle: 'pill', transition: 'fade', timeZone: TIME_ZONE.SHANGHAI,
  grayscale: false, colorVision: false, logo: true, breadcrumbs: true, tabs: true, watermark: false
}
const storageKey = 'npora-react-preferences'

export function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    const result = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof Preferences)[]) {
      const value = saved?.[key]
      if (key in options) {
        const allowed: readonly unknown[] = options[key as keyof typeof options]
        if (allowed.includes(value)) Object.assign(result, { [key]: value })
      } else if (typeof value === 'boolean') Object.assign(result, { [key]: value })
    }
    return result
  } catch {
    return { ...defaults }
  }
}

export function savePreferences(value: Preferences) {
  try { localStorage.setItem(storageKey, JSON.stringify(value)) }
  catch { /* Keep settings available for the current tab. */ }
}

export const PreferencesContext = createContext<{ preferences: Preferences; update: (value: Partial<Preferences>) => void; dark: boolean }>({
  preferences: defaults, update: () => {}, dark: false
})
export const usePreferences = () => useContext(PreferencesContext)
