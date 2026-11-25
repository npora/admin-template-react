import { App } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { registerPwaUpdates } from './pwa-update'

export default function PwaUpdatePrompt() {
  const { modal } = App.useApp()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const controller = new AbortController()
    void registerPwaUpdates(
      new URL(`${import.meta.env.BASE_URL}sw.js`, document.baseURI),
      () => new Promise<boolean>((resolve) => {
        modal.info({
          title: i18n.t('appUpdateTitle'),
          content: i18n.t('appUpdateMessage'),
          okText: i18n.t('appUpdateRefresh'),
          closable: true,
          mask: { closable: false },
          onOk: () => resolve(true),
          afterClose: () => resolve(false)
        })
      }),
      () => window.location.reload(),
      controller.signal
    ).catch(() => undefined)
    return () => controller.abort()
  }, [i18n, modal])

  return null
}
