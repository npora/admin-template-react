import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../api/client'

export function useAccountRequest(token: string, onExpired: () => void) {
  const { t } = useTranslation()
  const active = useRef<AbortController>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => active.current?.abort(), [token])

  async function run<T>(endpoint: string, options: { method?: 'GET' | 'POST' | 'DELETE'; json?: object }, done: (result: T) => void) {
    if (active.current) return
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    try {
      const result = await request<T>(endpoint, { ...options, token, signal: controller.signal })
      if (!controller.signal.aborted) done(result)
    } catch (reason) {
      if (controller.signal.aborted) return
      if (reason instanceof ApiError && (reason.status === 401 || String(reason.code) === '10002')) onExpired()
      else setError(reason instanceof ApiError ? reason.message : t('tryAgain'))
    } finally {
      if (active.current === controller) active.current = undefined
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return { busy, error, run }
}
