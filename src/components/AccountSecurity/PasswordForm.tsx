import { Alert, Button, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAccountRequest } from './useAccountRequest'

type Values = { currentPassword: string; newPassword: string; confirmation: string; totpCode?: string }

export default function PasswordForm({ token, endpoint, administrator = false, showTotp, onExpired, onSaved }: {
  token: string
  endpoint: string
  administrator?: boolean
  showTotp?: boolean
  onExpired: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [form] = Form.useForm<Values>()
  const { busy, error, run } = useAccountRequest(token, onExpired)
  return <Form form={form} layout="vertical" disabled={busy} onFinish={({ currentPassword,newPassword,totpCode }: Values) => {
    void run(endpoint, { method:'POST', json:{ currentPassword,newPassword,totpCode:totpCode || undefined } }, () => {
      form.resetFields()
      onSaved()
    })
  }}>
    <Form.Item name="currentPassword" label={t(administrator ? 'administratorPassword' : 'currentPasswordLabel')} rules={[{required:true,max:128}]}>
      <Input.Password autoComplete="current-password" />
    </Form.Item>
    {showTotp && <Form.Item name="totpCode" label={t('authenticatorCode')} rules={[{pattern:/^[0-9]{6}$/}]}>
      <Input autoComplete="one-time-code" inputMode="numeric" maxLength={6} />
    </Form.Item>}
    <Form.Item name="newPassword" label={t('newPasswordLabel')} rules={[{required:true,min:6,max:128}]}>
      <Input.Password autoComplete="new-password" />
    </Form.Item>
    <Form.Item name="confirmation" label={t('confirmNewPassword')} dependencies={['newPassword']} rules={[
      {required:true}, ({getFieldValue})=>({validator:(_,value:string)=>value===getFieldValue('newPassword')
        ? Promise.resolve() : Promise.reject(new Error(t('passwordMismatch')))})
    ]}><Input.Password autoComplete="new-password" /></Form.Item>
    {error && <Alert type="error" title={error} />}
    <Button type="primary" htmlType="submit" loading={busy}>{t(administrator ? 'resetPassword' : 'changePassword')}</Button>
  </Form>
}
