import { Alert, Button, Form, Input, Modal } from 'antd'
import { useEffect, useId, useRef, useState } from 'react'
import { appTitle } from '../../config/app'
import { localIcons } from '../../icons/local'
import { usePreferences } from '../../settings/preferences'
import './ScreenLock.scss'
import { useTranslation } from 'react-i18next'
import { clearScreenLock, createScreenLock, readScreenLock, saveScreenLock, verifyScreenLock } from '../screen-lock'

export default function ScreenLock({ open, locked, onClose, onLock, onLogout, loggingOut, logoutError }: {
  open: boolean
  locked: boolean
  onClose: () => void
  onLock: (value: boolean) => void
  onLogout: () => void
  loggingOut: boolean
  logoutError: boolean
}) {
  const { t, i18n } = useTranslation()
  const { preferences: { timeZone } } = usePreferences()
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const [now, setNow] = useState(() => Date.now())
  const LockIcon = localIcons['nova-screen-lock']

  useEffect(() => {
    const element = dialog.current
    if (!locked || !element) return
    if (!element.open) element.showModal()
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      window.clearInterval(interval)
      if (element.open) element.close()
    }
  }, [locked])

  const [form] = Form.useForm<{ password: string }>()
  const passwordValue = Form.useWatch('password', form)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)

  async function submit({ password }: { password: string }) {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      if (!globalThis.crypto?.subtle) { setError('lockRequiresSecureContext'); return }
      if (locked) {
        const lock = readScreenLock()
        if (!lock || !(await verifyScreenLock(lock, password))) { setError('invalidLockPassword'); return }
        clearScreenLock()
        onLock(false)
      } else {
        saveScreenLock(await createScreenLock(password))
        onLock(true)
      }
      form.resetFields()
      onClose()
    } catch { setError('screenLockFailed') }
    finally { pending.current = false; setBusy(false) }
  }

  if (locked) {
    const lang = i18n.resolvedLanguage
    const clock = new Intl.DateTimeFormat(lang, {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone
    }).format(now)
    const day = new Intl.DateTimeFormat(lang, {
      month: 'long', day: 'numeric', weekday: 'long', timeZone
    }).format(now)

    return <dialog ref={dialog} aria-labelledby={titleId} className="app-lock-screen"
      onCancel={(event) => event.preventDefault()}>
      <header className="app-lock-screen__brand">
        <span className="app-lock-screen__icon"><LockIcon /></span>{appTitle}
      </header>
      <section className="app-lock-screen__content">
        <h1 id={titleId}>{t('screenLocked')}</h1>
        <time className="app-lock-screen__time" dateTime={new Date(now).toISOString()}>{clock}</time>
        <p className="app-lock-screen__date">{day}</p>
        <p className="app-lock-screen__zone">{timeZone}</p>
        <Form form={form} className="app-lock-screen__form" disabled={busy || loggingOut} onFinish={(fields) => void submit(fields)}>
          <Form.Item name="password" noStyle>
            <Input type="password" autoComplete="off" aria-label={t('lockPassword')} placeholder={t('lockPassword')} maxLength={128} />
          </Form.Item>
          {(error || logoutError) && <p className="app-lock-screen__error" role="alert">{t(error || 'screenLockFailed')}</p>}
          <div className="app-lock-screen__actions">
            <Button type="primary" size="large" htmlType="submit" loading={busy} disabled={!passwordValue}>{t('unlockScreen')}</Button>
            <Button size="large" disabled={busy} loading={loggingOut} onClick={onLogout}>{t('signInAgain')}</Button>
          </div>
        </Form>
      </section>
    </dialog>
  }

  return <Modal open={open} centered title={t('lockScreen')} footer={null} closable={!busy}
    mask={{closable:!busy}} keyboard={!busy}
    onCancel={() => { if (!busy) { form.resetFields(); setError(''); onClose() } }}>
    <p>{t('lockPasswordHint')}</p>
    <Form form={form} disabled={busy} layout="vertical" onFinish={(fields) => void submit(fields)}>
      <Form.Item name="password" label={t('lockPassword')} rules={[{required:true,min:6,max:128,message:t('lockPasswordLength')}]}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      {error && <Alert type="error" title={t(error)} />}
      <Button type="primary" htmlType="submit" loading={busy}>{t('lockScreen')}</Button>
    </Form>
  </Modal>
}
