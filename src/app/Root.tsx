import { accents, PreferencesContext, readPreferences, savePreferences } from '../settings/preferences'
import type { Preferences } from '../settings/preferences'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import enUS from 'antd/locale/en_US'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import zhCN from 'antd/locale/zh_CN'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import AppRouter from '../router'
import { applyTimeZone } from '../utils/datetime'
import PwaUpdatePrompt from '../startup/PwaUpdatePrompt'

const router = createBrowserRouter([{ path: '*', element: <AppRouter /> }])

export default function Root() {
  const [preferences, setPreferences] = useState(readPreferences)
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const { timeZone } = preferences
  useLayoutEffect(() => { applyTimeZone(timeZone) }, [timeZone])
  const dark = preferences.mode === 'dark' || (preferences.mode === 'system' && systemDark)
  function update(value: Partial<Preferences>) {
    setPreferences((previous) => ({ ...previous, ...value }))
  }
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)')
    const change = () => setSystemDark(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.classList.toggle('np-grayscale', preferences.grayscale)
    root.classList.toggle('np-color-vision', preferences.colorVision)
    root.dataset.npAccent = preferences.accent
    savePreferences(preferences)
  }, [dark, preferences])
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'zh-CN'

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <PreferencesContext value={{ preferences, update, dark }}>
    <ConfigProvider
      locale={language === 'en-US' ? enUS : zhCN}
      componentSize={preferences.size === 'default' ? 'middle' : preferences.size}
      button={{ autoInsertSpace: false }}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: accents[preferences.accent],
          colorText: dark ? '#e4ebf7' : '#203047',
          colorTextSecondary: dark ? '#b3bfd2' : '#53647b',
          colorBorder: dark ? '#354156' : '#dce4ef',
          fontFamily: 'var(--app-font-family)',
          fontSize: 13,
          lineHeight: 1.5,
          borderRadius: 8
        }
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
        <PwaUpdatePrompt />
      </AntApp>
    </ConfigProvider>
    </PreferencesContext>
  )
}
