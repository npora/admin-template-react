import { Form, Input, Modal, Select, TreeSelect } from 'antd'
import { useTranslation } from 'react-i18next'
import type { DepartmentOption, ManagedUser, RoleOption, UserFields } from '../../../../api/modules/user'

export type UserFormFields = UserFields & { username: string; password: string }

export default function UserForm({ user, departments, roles, assignRoles, busy, onClose, onSave }: {
  user: ManagedUser | null
  departments: DepartmentOption[]
  roles: RoleOption[]
  assignRoles: boolean
  busy: boolean
  onClose: () => void
  onSave: (value: UserFormFields) => void
}) {
  const { t } = useTranslation()
  const [form] = Form.useForm<UserFormFields>()
  return (
    <Modal open title={t(user ? 'editUser' : 'addUser')} onCancel={onClose}
      onOk={() => form.submit()} confirmLoading={busy} mask={{ closable: !busy }}>
      <Form form={form} layout="vertical" disabled={busy}
        initialValues={user ?? { status: 1, roleIds: [] }} onFinish={onSave}>
        <Form.Item name="username" label={t('username')} rules={[{ required: true, pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,63}$/ }]}>
          <Input disabled={Boolean(user)} maxLength={64} />
        </Form.Item>
        {!user && (
          <Form.Item name="password" label={t('password')} rules={[{ required: true, min: 12, max: 128 }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}
        <Form.Item name="displayName" label={t('displayName')} rules={[{ required: true, whitespace: true, max: 64 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="departmentId" label={t('assignedDepartment')}>
          <TreeSelect allowClear treeData={departments} fieldNames={{ label: 'name', value: 'id' }}
            treeNodeFilterProp="name" showSearch />
        </Form.Item>
        <Form.Item name="roleIds" label={t('roleLabel')}>
          <Select mode="multiple" disabled={!assignRoles} options={roles.map((role) => ({
            value: role.id, label: role.name, disabled: role.status === 0 && !user?.roleIds?.includes(role.id)
          }))} />
        </Form.Item>
        <Form.Item name="email" label={t('email')} rules={[{ type: 'email' }]}><Input /></Form.Item>
        <Form.Item name="mobile" label={t('mobile')}><Input /></Form.Item>
        <Form.Item name="avatar" label={t('avatarURL')}><Input /></Form.Item>
        <Form.Item name="status" label={t('status')}>
          <Select disabled={user?.isSuperAdmin} options={[{ value: 1, label: t('enabled') }, { value: 0, label: t('inactive') }]} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
