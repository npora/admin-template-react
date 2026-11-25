import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import LanguageSwitch from '../../components/LanguageSwitch'
import { Button, Form, Input } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../../api/client'

interface RecoveryFields {
  username: string
  totpCode: string
  newPassword: string
  confirmation: string
}

export default function PasswordRecovery({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  const [form] = Form.useForm<RecoveryFields>()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const request = useRef<AbortController>(undefined)
  const contact = import.meta.env.VITE_PASSWORD_RESET_CONTACT?.trim()

  useEffect(() => () => request.current?.abort(), [])

  async function submit({ username, totpCode, newPassword }: RecoveryFields) {
    if (request.current || complete) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      await api.resetPassword({ username: username.trim(), totpCode, newPassword }, controller.signal)
      if (controller.signal.aborted) return
      onReset()
      form.resetFields()
      setComplete(true)
    } catch (error) {
      if (!controller.signal.aborted)
        setError(error instanceof ApiError ? error.message : '暂时无法连接服务，请重试。')
    } finally {
      if (!controller.signal.aborted) setPending(false)
      request.current = undefined
    }
  }

  return (
    <main className="login">
      <div className="login__language"><LanguageSwitch /></div>
      <section className="login__card">
        <h1><LockOutlined /> {t('recoverPassword')}</h1>
        <p>{t('recoverPasswordDescription')}</p>
        {complete ? (
          <p role="status">{t('passwordUpdated')}</p>
        ) : (
          <Form form={form} layout="vertical" disabled={pending} onFinish={submit}>
            <Form.Item name="username" label={t('username')} rules={[{ required: true, whitespace: true, message: t('enterYourUsername') }]}>
              <Input autoComplete="username" maxLength={64} />
            </Form.Item>
            <Form.Item name="totpCode" label={t('authenticatorCode')} rules={[{ required: true, pattern: /^[0-9]{6}$/, message: t('enterAuthenticatorCode') }]}>
              <Input autoComplete="one-time-code" inputMode="numeric" maxLength={6} />
            </Form.Item>
            <Form.Item name="newPassword" label={t('newPasswordLabel')} rules={[{ required: true, min: 6, max: 128, message: t('passwordMustContain6128Characters') }]}>
              <Input.Password autoComplete="new-password" maxLength={128} />
            </Form.Item>
            <Form.Item name="confirmation" label={t('confirmNewPassword')} dependencies={['newPassword']} rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator: (_, value: string) =>
                  !value || value === getFieldValue('newPassword')
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('passwordMismatch')))
              })
            ]}>
              <Input.Password autoComplete="new-password" maxLength={128} />
            </Form.Item>
            {error && <p role="alert">{error}</p>}
            <Button type="primary" htmlType="submit" loading={pending} block>{t('resetPassword')}</Button>
          </Form>
        )}
        <p>{contact ? t('passwordResetContact', { contact }) : t('passwordResetAdministrator')}</p>
        <Link to="/login"><ArrowLeftOutlined /> {t('backToSignIn')}</Link>
      </section>
    </main>
  )
}
