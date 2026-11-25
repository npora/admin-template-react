import { UserOutlined } from '@ant-design/icons'
import { Alert, Avatar, Button, Card, Form, Input, Space, Tabs, Tag } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsFields } from '../../layout/components/AppSettings'
import PasswordForm from '../../components/AccountSecurity/PasswordForm'
import Authenticator from '../../components/AccountSecurity/Authenticator'
import SessionList from '../../components/SessionList'
import { authenticatorEnabled } from '../../config/app'
import type { PageProps } from '../../components/ManagementPage'

import './index.scss'

interface Details { displayName: string; email?: string; mobile?: string; avatar?: string; bio?: string }

export default function Profile({ user, token, onExpired }: PageProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<Details>()
  const key = `npora-react-profile:${user.id}`
  const defaults = { displayName: user.displayName || user.username }
  const [saved, setSaved] = useState<Details>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) ?? '{}') } }
    catch { return defaults }
  })
  const [notice, setNotice] = useState('')
  return (
    <section className="management profile-page">
      <div className="management__heading"><div><small>{t('profile:eyebrow')}</small><h1>{t('profile:title')}</h1><p>{t('profile:description')}</p></div></div>
      <div className="profile-grid">
        <Card className="profile-summary">
          <Avatar size={78} src={saved.avatar || user.avatar} icon={<UserOutlined />} />
          <h2>{saved.displayName}</h2>
          <p>{user.username}</p>
          <div className="profile-summary__roles">
            {user.isSuperAdmin && <Tag color="blue">{t('superAdministrator')}</Tag>}
            {user.roles?.map((role) => <Tag key={role} title={role}>{role}</Tag>)}
          </div>
          <dl>
            <div><dt>{t('profile:account')}</dt><dd>{user.username}</dd></div>
            <div><dt>{t('profile:permissions')}</dt><dd>{user.isSuperAdmin || user.permissions.includes('*') ? t('profile:allPermissions') : user.permissions.length}</dd></div>
          </dl>
          <p className="profile-summary__note">{t('profile:accountReadOnly')}</p>
        </Card>
        <Card className="profile-content">
          <Tabs items={[
            { key: 'details', label: t('profile:details'), children: <>
              <Alert className="profile-notice" type="info" showIcon title={t('profile:localNotice')} />
              <Form form={form} layout="vertical" requiredMark={false} initialValues={saved} onFinish={(details) => {
                localStorage.setItem(key, JSON.stringify(details))
                setSaved(details)
                setNotice(t('profile:saved'))
              }}>
                <Form.Item name="displayName" label={t('displayName')} rules={[{required:true,whitespace:true,max:100}]}><Input maxLength={100} /></Form.Item>
                <div className="profile-fields">
                <Form.Item name="email" label={t('email')} rules={[{type:'email'}]}><Input maxLength={255} /></Form.Item>
                <Form.Item name="mobile" label={t('mobile')}><Input maxLength={32} /></Form.Item>
                </div>
                <Form.Item name="avatar" label={t('avatarURL')} rules={[{pattern:/^https?:\/\//}]}><Input placeholder="https://" maxLength={500} /></Form.Item>
                <Form.Item name="bio" label={t('profile:bio')}><Input.TextArea maxLength={400} rows={4} showCount /></Form.Item>
                <Space wrap>
                  <Button type="primary" htmlType="submit">{t('profile:saveLocal')}</Button>
                  <Button onClick={() => { form.resetFields(); form.setFieldsValue(saved) }}>{t('profile:discard')}</Button>
                  <Button type="text" danger onClick={() => {
                    if (!window.confirm(t('profile:resetConfirm'))) return
                    localStorage.removeItem(key)
                    setSaved(defaults)
                    form.setFieldsValue({ ...defaults, email: '', mobile: '', avatar: '', bio: '' })
                    setNotice(t('profile:restored'))
                  }}>{t('profile:resetLocal')}</Button>
                </Space>
              </Form>
              {notice && <p role="status">{notice}</p>}
            </> },
            { key: 'preferences', label: t('profile:preferences'), children: <SettingsFields /> },
            { key: 'password', destroyOnHidden: true, label: t('changePassword'), children: <PasswordForm endpoint="/auth/password/change"
              token={token} onExpired={onExpired} onSaved={onExpired} showTotp={authenticatorEnabled} /> },
            { key: 'sessions', destroyOnHidden: true, label: t('profile:sessions'), children: <SessionList endpoint="/auth/sessions"
              token={token} onExpired={onExpired} own revoke /> },
            ...(authenticatorEnabled ? [{ key: 'totp', destroyOnHidden: true, label: t('authenticator'), children: <Authenticator endpoint="/auth/totp"
              token={token} onExpired={onExpired} onChanged={onExpired} /> }] : [])
          ]} />
        </Card>
      </div>
    </section>
  )
}
