import PasswordForm from '../../../components/AccountSecurity/PasswordForm'
import Authenticator from '../../../components/AccountSecurity/Authenticator'
import SessionList from '../../../components/SessionList'
import UserPermissionPreview from './components/UserPermissionPreview'
import { usePreferences } from '../../../settings/preferences'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Avatar, Button, Dropdown, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, TreeSelect } from 'antd'
import type { TableColumnsType } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../api/client'
import { userApi } from '../../../api/modules/user'
import type { DepartmentOption, ManagedUser, RoleOption, UserFields, UserFilters } from '../../../api/modules/user'
import { can } from '../../../auth/permissions'
import type { Session } from '../../../auth/types'
import { formatDate } from '../../../utils/datetime'
import UserForm from './components/UserForm'
import type { UserFormFields } from './components/UserForm'
import './index.scss'

export default function UserList({ token, user, onExpired }: {
  token: string
  user: Session['user']
  onExpired: () => void
}) {
  const { preferences: { timeZone } } = usePreferences()
  const { t } = useTranslation()
  const [form] = Form.useForm<UserFilters>()
  const [query, setQuery] = useState<UserFilters & { page: number; pageSize: number }>({ page: 1, pageSize: 10 })
  const [rows, setRows] = useState<ManagedUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [optionsError, setOptionsError] = useState(false)
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [inspection, setInspection] = useState<{ key: string; row: ManagedUser }>()
  const [editing, setEditing] = useState<ManagedUser | null>()
  const [busy, setBusy] = useState(false)
  const operation = useRef<AbortController>(undefined)

  useEffect(() => () => operation.current?.abort(), [token])
  useEffect(() => {
    const controller = new AbortController()
    Promise.allSettled([
      userApi.departments(token, controller.signal),
      userApi.roles(token, controller.signal)
    ]).then(([departmentResult, roleResult]) => {
      if (controller.signal.aborted) return
      if (departmentResult.status === 'fulfilled') setDepartments(departmentResult.value)
      if (roleResult.status === 'fulfilled') setRoles(roleResult.value)
      setOptionsError(departmentResult.status === 'rejected' || roleResult.status === 'rejected')
    })
    return () => controller.abort()
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    userApi.list(token, query, controller.signal).then(({ list, total }) => {
      if (controller.signal.aborted) return
      setRows(list)
      setTotal(total)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else setError(error instanceof ApiError ? error.message : t('couldNotLoadTheListRefreshToTryAgain'))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [token, query, onExpired, t])

  function load(next = { ...query }) {
    setLoading(true)
    setError('')
    setQuery(next)
  }

  async function mutate(run: (signal: AbortSignal) => Promise<unknown>, page = query.page) {
    if (operation.current) return
    const controller = new AbortController()
    operation.current = controller
    setBusy(true)
    setError('')
    try {
      await run(controller.signal)
      if (controller.signal.aborted) return
      setEditing(undefined)
      load({ ...query, page })
    } catch (error) {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else setError(error instanceof ApiError ? error.message : t('tryAgain'))
    } finally {
      operation.current = undefined
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  function save(values: UserFormFields) {
    const fields: UserFields = {
      displayName: values.displayName.trim(),
      departmentId: values.departmentId ?? null,
      email: values.email?.trim() || null,
      mobile: values.mobile?.trim() || null,
      avatar: values.avatar?.trim() || null,
      status: values.status,
      roleIds: [...(can(user, 'system:user:assign-roles') ? (values.roleIds ?? []) : (editing?.roleIds ?? []))].sort((a, b) => a - b)
    }
    if (editing) {
      const original = { ...editing, roleIds: [...(editing.roleIds ?? [])].sort((a, b) => a - b) }
      if (Object.entries(fields).every(([key, value]) => JSON.stringify(original[key as keyof UserFields]) === JSON.stringify(value))) {
        setEditing(undefined)
        return
      }
      void mutate((signal) => userApi.update(token, editing.id, fields, signal))
    } else {
      void mutate((signal) => userApi.create(token, { ...fields, username: values.username.trim(), password: values.password }, signal), 1)
    }
  }

  const columns: TableColumnsType<ManagedUser> = [
    { title: t('user'), key: 'identity', width: 180, render: (_, row) => (
      <Space className="user-management__identity">
        <Avatar shape="square" size={36} src={row.avatar}>{row.displayName.slice(0, 1)}</Avatar>
        <div><strong>{row.displayName}</strong><small>{row.username}</small></div>
      </Space>
    ) },
    { title: t('userContact'), key: 'contact', width: 160, render: (_, row) => <div>{row.email || '—'}{row.mobile && <small>{row.mobile}</small>}</div> },
    { title: t('roleLabel'), key: 'roles', width: 150, render: (_, row) => (
      <Space wrap size={[4, 4]}>
        {row.isSuperAdmin && <Tag color="red">{t('superAdministrator')}</Tag>}
        {row.roles?.map((role) => <Tag key={role.id} color={role.status === 0 ? 'gold' : 'default'}>{role.name}{role.status === 0 ? t('disabledSuffix') : ''}</Tag>)}
        {!row.roles?.length && !row.isSuperAdmin && t('noRolesAssigned')}
      </Space>
    ) },
    { title: t('department'), dataIndex: 'departmentName', width: 110, ellipsis: true },
    { title: t('status'), key: 'status', width: 90, render: (_, row) => <Tag color={row.status === 1 ? 'green' : 'default'}>{t(row.status === 1 ? 'enabled' : 'inactive')}</Tag> },
    { title: t('createdAt'), key: 'createdAt', width: 172, render: (_, row) => typeof row.createdAt === 'number' ? formatDate(row.createdAt, timeZone) : '—' }
  ]
  if (import.meta.env.VITE_AUTHENTICATOR_ENABLED === 'true') {
    columns.splice(5, 0, { title: t('authenticator'), key: 'authenticator', width: 110,
      render: (_, row) => <Tag color={row.authenticatorEnabled ? 'green' : 'default'}>{t(row.authenticatorEnabled ? 'authenticatorBound' : 'authenticatorUnbound')}</Tag> })
  }
  if (user.isSuperAdmin || ['system:user:update','system:user:delete','system:user:permission-preview','system:user-session:list'].some((permission) => can(user,permission))) {
    columns.push({ title: t('actions'), key: 'actions', width: 150, fixed: 'right', render: (_, row) => (
      <Space size={0}>
        {can(user, 'system:user:update') && <Button type="link" disabled={busy} onClick={() => setEditing(row)}>{t('edit')}</Button>}
        {(() => {
          const security = user.isSuperAdmin && (!row.isSuperAdmin || row.id === user.id)
          const items = [
            ...(can(user,'system:user:permission-preview') ? [{ key:'preview', label:t('userPermissionPreview') }] : []),
            ...(can(user,'system:user-session:list') && (!row.isSuperAdmin || row.id === user.id) ? [{ key:'sessions', label:t('userSessions') }] : []),
            ...(security ? [{ key:'password', label:t('resetPassword') }] : []),
            ...(security && row.status === 1 && import.meta.env.VITE_AUTHENTICATOR_ENABLED === 'true' ? [{ key:'totp', label:t('manageAuthenticator') }] : [])
          ]
          return items.length > 0 && <Dropdown trigger={['click']} menu={{items,onClick:({key})=>setInspection({key,row})}}>
            <Button type="link" disabled={busy}>{t('moreActions')}</Button>
          </Dropdown>
        })()}
        {can(user, 'system:user:delete') && !row.isSuperAdmin && row.id !== user.id && (
          <Popconfirm title={t('deleteUser')} onConfirm={() => mutate((signal) => userApi.remove(token, row.id, signal), rows.length === 1 ? Math.max(1, query.page - 1) : query.page)}>
            <Button type="link" danger disabled={busy}>{t('delete')}</Button>
          </Popconfirm>
        )}
      </Space>
    ) })
  }

  return (
    <section className="user-management">
      <header className="user-management__heading">
        <div>
          <small>{t('organizationAndAccess')}</small>
          <h1>{t('userManagement')}</h1>
          <p>{t('manageUserProfilesRolesAndAccountStatus')}</p>
        </div>
        {can(user, 'system:user:create') && <Button type="primary" icon={<PlusOutlined />} disabled={busy} onClick={() => setEditing(null)}>{t('addUser')}</Button>}
      </header>
      <Form form={form} className="user-management__filters" layout="vertical" disabled={busy}
        onFinish={(filters) => load({ ...filters, keyword: filters.keyword?.trim() || undefined, page: 1, pageSize: query.pageSize })}>
        <Form.Item name="keyword" label={t('keyword')}><Input allowClear maxLength={100} prefix={<SearchOutlined />} placeholder={t('searchByUsernameDisplayNameOrEmail')} /></Form.Item>
        <Form.Item name="departmentId" label={t('assignedDepartment')}><TreeSelect allowClear treeData={departments} fieldNames={{ label: 'name', value: 'id' }} placeholder={t('allDepartmentsIncludingDescendants')} /></Form.Item>
        <Form.Item name="roleId" label={t('roleLabel')}><Select allowClear options={roles.map(({ id, name }) => ({ value: id, label: name }))} placeholder={t('allRoles')} /></Form.Item>
        <Form.Item name="status" label={t('status')}><Select allowClear placeholder={t('allStatuses')} options={[{ value: 1, label: t('enabled') }, { value: 0, label: t('inactive') }]} /></Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>{t('search')}</Button>
          <Button onClick={() => { form.resetFields(); load({ page: 1, pageSize: query.pageSize }) }}>{t('reset')}</Button>
        </Space>
      </Form>
      <div className="user-management__table" aria-busy={loading}>
        <div className="user-management__toolbar">
          <Space><h2>{t('userList')}</h2><Tag>{t('usersInTotal', { value: total }).split(' | ')[total === 1 ? 0 : 1] ?? t('usersInTotal', { value: total })}</Tag></Space>
          <Button icon={<ReloadOutlined />} disabled={busy} loading={loading} onClick={() => load()}>{t('refresh')}</Button>
        </div>
        {optionsError && <Alert type="warning" title={t('couldNotLoadTheListRefreshToTryAgain')} />}
        {error && <Alert type="error" title={error} />}
        <Table<ManagedUser> rowKey="id" bordered size="middle" columns={columns} dataSource={rows} loading={loading}
          scroll={{ x: 'max-content' }} locale={{ emptyText: t('noMatchingUsersAdjustTheFiltersOrAddAUser') }}
          pagination={{ current: query.page, pageSize: query.pageSize, total, disabled: busy,
            showSizeChanger: true, placement: ['bottomCenter'],
            onChange: (page, pageSize) => load({ ...query, page: pageSize === query.pageSize ? page : 1, pageSize }) }} />
      </div>
      {inspection && <Modal open width={720} title={t(inspection.key==='preview'?'userPermissionPreview':inspection.key==='sessions'?'userSessions':inspection.key==='password'?'resetPassword':'manageAuthenticator')}
        footer={null} onCancel={()=>setInspection(undefined)}>
        {inspection.key==='preview' && <UserPermissionPreview token={token} id={inspection.row.id} onExpired={onExpired} />}
        {inspection.key==='sessions' && <SessionList token={token} endpoint={`/system/users/${inspection.row.id}/sessions`}
          onExpired={onExpired} revoke={can(user,'system:user-session:revoke')} />}
        {inspection.key==='password' && <PasswordForm token={token} endpoint={`/system/users/${inspection.row.id}/password`} administrator
          onExpired={onExpired} onSaved={()=>{setInspection(undefined);if(inspection.row.id===user.id)onExpired()}} />}
        {inspection.key==='totp' && <Authenticator token={token} endpoint={`/system/users/${inspection.row.id}/totp`} administrator
          onExpired={onExpired} onChanged={()=>{setInspection(undefined); if(inspection.row.id===user.id)onExpired(); else load()}} />}
      </Modal>}
      {editing !== undefined && <UserForm key={editing?.id ?? 'new'} user={editing} departments={departments} roles={roles}
        assignRoles={can(user, 'system:user:assign-roles')} busy={busy} onClose={() => { if (!busy) setEditing(undefined) }} onSave={save} />}
    </section>
  )
}
