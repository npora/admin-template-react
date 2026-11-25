import { useEffect, useState } from 'react'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from 'react-router'
import { Alert, Button, Checkbox, Form, Input, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../../api/client'
import type { Session } from '../../auth/types'
import type { Credential } from '../../auth/credential'
import { appTitle, authenticatorEnabled, demoEnabled, tokenStorageMode } from '../../config/app'
import Brand from '../../components/Brand'
import LanguageSwitch from '../../components/LanguageSwitch'

interface LoginFields {
  username: string
  password: string
  totpCode?: string
  remember?: boolean
}

export default function Login({
  onLogin
}: {
  onLogin: (credential: Credential, session: Session, remember: boolean) => void
}) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const [totp, setTotp] = useState(authenticatorEnabled)
  const [totpRequired, setTotpRequired] = useState(false)
  const [error, setError] = useState('')
  const [retryAt, setRetryAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const seconds = Math.max(0, Math.ceil((retryAt - now) / 1000))

  useEffect(() => {
    if (!retryAt) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= retryAt) setRetryAt(0)
    }, 250)
    return () => window.clearInterval(timer)
  }, [retryAt])

  async function submit(fields: LoginFields) {
    if (pending || Date.now() < retryAt) return
    const remember = Boolean(fields.remember)
    setPending(true)
    setError('')
    try {
      const login = await api.login({
        username: fields.username.trim(),
        password: fields.password,
        rememberMe: remember,
        totpCode: totp ? fields.totpCode?.trim() || undefined : undefined
      })
      try {
        onLogin(
          { token: login.accessToken, expiresAt: login.expiresAt },
          await api.session(login.accessToken),
          remember
        )
      } catch (error) {
        void api.logout(login.accessToken).catch(() => {})
        throw error
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (String(error.code) === '10003') {
          setTotp(true)
          setTotpRequired(true)
        }
        if (error.status === 429 && error.retryAt > Date.now()) {
          setNow(Date.now())
          setRetryAt(error.retryAt)
        }
        setError(error.message)
      } else setError(t('signInNetworkError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login login--split">
      <div className="login__language"><LanguageSwitch /></div>
      <section className="login__brand" aria-label={appTitle}>
        <div className="login__brand-copy">
          <span className="login__mark" aria-hidden="true">N</span>
          <h1>{appTitle}</h1>
          <p>{t('reactStarterTagline')}</p>
        </div>
        <small>Powered by Npora</small>
      </section>
      <div className="login__content">
        <Form<LoginFields> className="login__card" onFinish={submit} disabled={pending} requiredMark={false}>
          <div className="login__mobile-brand"><Brand /></div>
          <header>
            <h1>{t('welcomeBack')}</h1>
            <p>{t('enterYourCredentialsToAccessTheWorkspace')}</p>
          </header>
          <Form.Item name="username" rules={[{ required: true, whitespace: true, message: t('enterYourUsername') }]}>
            <Input prefix={<UserOutlined />} allowClear autoComplete="username" placeholder={t('username')} aria-label={t('username')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('enterYourPassword') }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder={t('password')} aria-label={t('password')} />
          </Form.Item>
          {totp && (
            <Form.Item name="totpCode" rules={[
              { required: totpRequired, message: t('enterAuthenticatorCode') },
              { pattern: /^[0-9]{6}$/, message: t('enterAuthenticatorCode') }
            ]}>
              <Input
                prefix={<LockOutlined />}
                aria-label={t('authenticatorCode')}
                placeholder={t(totpRequired ? 'enterAuthenticatorCode' : 'authenticatorCodeOptional')}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
              />
            </Form.Item>
          )}
          <div className="login__options">
            {tokenStorageMode !== 'memory' && (
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{t('rememberLogin')}</Checkbox>
              </Form.Item>
            )}
            <Link to="/forgot-password">{t('forgotPassword')}</Link>
          </div>
          {error && <Alert type="error" showIcon title={error} />}
          {seconds > 0 && <p id="sign-in-retry" role="timer">{t('signInRetryAfter', { seconds })}</p>}
          <Button type="primary" htmlType="submit" loading={pending} disabled={seconds > 0}
            aria-describedby={seconds > 0 ? 'sign-in-retry' : undefined}>
            {t('signIn')}
          </Button>
          {demoEnabled && <div className="login__demo"><Tag color="blue">Demo</Tag>{t('demoCredentialsHint')}</div>}
        </Form>
      </div>
    </main>
  )
}
