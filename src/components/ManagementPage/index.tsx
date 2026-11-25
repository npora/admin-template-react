import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag } from 'antd'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../api/client'
import { can } from '../../auth/permissions'
import type { Session } from '../../auth/types'

export interface PageProps {
  user: Session['user']
  token: string
  onExpired: () => void
}
type Value = string | number | boolean | null
export type ManagementRow = { id: number; children?: ManagementRow[] } & Record<string, unknown>
export interface Field {
  name: string
  label: string
  kind?: 'number' | 'switch' | 'select'
  options?: { value: string | number; label: string }[]
  required?: boolean
  initial?: Value
  json?: boolean
}
export interface ManagementConfig {
  title: string
  subtitle: string
  tableTitle: string
  add: string
  endpoint: string
  permission: string
  paged?: boolean
  filters?: boolean
  fields: Field[]
  columns: { name: string; label: string }[]
}
type Row = ManagementRow

const statuses = [{ value: 1, label: 'enabled' }, { value: 0, label: 'disabled' }]

export default function ManagementPage({ config, user, token, onExpired, rowAction, renderField, onChanged }: PageProps & {
  config: ManagementConfig
  rowAction?: (row: ManagementRow, reload: () => void) => ReactNode
  renderField?: (field: Field, rows: ManagementRow[], editing: ManagementRow | null) => ReactElement | undefined
  onChanged?: () => void
}) {
  const { t } = useTranslation()
  const [filterForm] = Form.useForm<{ keyword?: string; status?: number }>()
  const [editor] = Form.useForm<Record<string, Value>>()
  const [query, setQuery] = useState<{ page: number; pageSize: number; keyword?: string; status?: number }>({ page: 1, pageSize: 10 })
  const [data, setData] = useState<{ list: Row[]; total: number }>({ list: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Row | null>()
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const write = useRef<AbortController>(undefined)
  const allowed = (action: string) => can(user, `system:${config.permission}:${action}`)

  useEffect(() => () => write.current?.abort(), [token])
  useEffect(() => {
    const controller = new AbortController()
    request<Row[] | { list: Row[]; total: number }>(config.endpoint, {
      token, signal: controller.signal, query: config.paged ? query : undefined
    }).then((result) => {
      if (!controller.signal.aborted) setData(Array.isArray(result) ? { list: result, total: result.length } : result)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else setError(error instanceof Error ? error.message : t('tryAgain'))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [config, token, query, onExpired, t])

  function load(next = { ...query }) {
    setError('')
    setLoading(true)
    setQuery(next)
  }
  function open(row: Row | null) {
    setEditError('')
    setEditing(row)
    editor.setFieldsValue(Object.fromEntries(config.fields.map((field) => [
      field.name, field.json && row?.[field.name] != null ? JSON.stringify(row[field.name]) : row?.[field.name] as Value ?? field.initial ?? null
    ])))
  }
  async function change(method: 'POST' | 'PUT' | 'DELETE', row: Row | null, json?: object) {
    if (write.current) return
    const controller = new AbortController()
    write.current = controller
    setSaving(true)
    setEditError('')
    try {
      await request(row ? `${config.endpoint}/${row.id}` : config.endpoint, { token, method, json, signal: controller.signal })
      if (controller.signal.aborted) return
      setEditing(undefined)
      load()
      onChanged?.()
    } catch (error) {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else (method === 'DELETE' ? setError : setEditError)(error instanceof Error ? error.message : t('tryAgain'))
    } finally {
      write.current = undefined
      if (!controller.signal.aborted) setSaving(false)
    }
  }
  function save(values: Record<string, Value>) {
    const row = editing ?? null
    const payload = Object.fromEntries(config.fields.map(({ name, json }) => {
      const value = values[name]
      if (json) {
        return [name, typeof value === 'string' && value.trim() ? JSON.parse(value) : null]
      }
      return [name, typeof value === 'string' ? value.trim() || null : value ?? null]
    }))
    if (row && Object.entries(payload).every(([key, value]) => JSON.stringify(row[key] ?? null) === JSON.stringify(value))) setEditing(undefined)
    else void change(row ? 'PUT' : 'POST', row, payload)
  }
  const filterRows = (rows: Row[]): Row[] => rows.flatMap((row) => {
    const children = row.children ? filterRows(row.children) : undefined
    const keyword = query.keyword?.toLowerCase()
    const matches = (!keyword || [row.name, row.code].some((field) => String(field ?? '').toLowerCase().includes(keyword)))
      && (query.status === undefined || row.status === query.status)
    return matches || children?.length ? [{ ...row, children }] : []
  })
  const rows = config.filters && !config.paged ? filterRows(data.list) : data.list

  return (
    <section className="management">
      <div className="management__heading">
        <div><small>{t('organizationAndAccess')}</small><h1>{t(config.title)}</h1><p>{t(config.subtitle)}</p></div>
        {allowed('create') && <Button type="primary" icon={<PlusOutlined />} onClick={() => open(null)}>{t(config.add)}</Button>}
      </div>
      {config.filters && <Form form={filterForm} layout="vertical" className="management__filters" onFinish={(filters) => load({ ...query, ...filters, page: 1 })}>
        <Form.Item name="keyword" label={t('keyword')}><Input allowClear prefix={<SearchOutlined />} /></Form.Item>
        <Form.Item name="status" label={t('status')}><Select allowClear placeholder={t('allStatuses')} options={statuses.map(({value,label})=>({value,label:t(label)}))} /></Form.Item>
        <Space><Button type="primary" htmlType="submit">{t('search')}</Button><Button onClick={() => { filterForm.resetFields(); load({ page: 1, pageSize: query.pageSize }) }}>{t('reset')}</Button></Space>
      </Form>}
      <div className="management__card">
        <div className="management__toolbar"><h2>{t(config.tableTitle)}</h2><Button icon={<ReloadOutlined />} onClick={() => load()}>{t('refresh')}</Button></div>
        {error && <Alert type="error" title={error} />}
        <Table<Row> rowKey="id" size="middle" bordered loading={loading} dataSource={rows} scroll={{ x: 'max-content' }}
          pagination={config.paged ? { current: query.page, pageSize: query.pageSize, total: data.total, showSizeChanger: true, placement: ['bottomCenter'],
            onChange: (page, pageSize) => load({ ...query, page: query.pageSize === pageSize ? page : 1, pageSize }) } : false}
          columns={[
            ...config.columns.map(({ name, label }) => ({ key: name, title: t(label), render: (_: unknown, row: Row) => {
              if (name === 'status') return <Tag color={row.status === 1 ? 'green' : 'default'}>{t(row.status === 1 ? 'enabled' : 'disabled')}</Tag>
              return String(row[name] ?? '—')
            } })),
            ...(rowAction || allowed('update') || allowed('delete') ? [{ key: 'actions', title: t('actions'), render: (_: unknown, row: Row) => (
              <Space>
                {allowed('update') && <Button type="link" onClick={() => open(row)}>{t('edit')}</Button>}
                {rowAction?.(row, () => load())}
                {allowed('delete') && <Popconfirm title={t('confirmDeletion')} onConfirm={() => change('DELETE', row)}><Button danger type="link">{t('delete')}</Button></Popconfirm>}
              </Space>
            ) }] : [])
          ]} />
      </div>
      <Modal open={editing !== undefined} title={t(editing ? 'edit' : config.add)} onCancel={() => { if (!saving) setEditing(undefined) }} onOk={() => editor.submit()} confirmLoading={saving}>
        <Form form={editor} layout="vertical" onFinish={save} disabled={saving}>
          {editError && <Alert type="error" title={editError} />}
          {config.fields.map((field) => <Form.Item key={field.name} name={field.name} label={t(field.label)}
            valuePropName={field.kind === 'switch' ? 'checked' : 'value'} rules={[{ required: field.required }, ...(field.json ? [{ validator: (_: unknown, value: string | null) => {
              if (!value?.trim()) return Promise.resolve()
              try {
                const data = JSON.parse(value)
                if (data !== null && (typeof data !== 'object' || Array.isArray(data) ||
                  Object.values(data).some(item => !['string','number','boolean'].includes(typeof item)))) throw new Error()
                return Promise.resolve()
              } catch {
                return Promise.reject(new Error(t('defaultQueryMustBeAValidJSONObjectWithStringNumberOr')))
              }
            } }] : [])]}>
            {renderField?.(field, data.list, editing ?? null) ?? (field.kind === 'switch' ? <Switch /> : field.kind === 'number' ? <InputNumber style={{ width: '100%' }} />
              : field.kind === 'select' ? <Select options={(field.options ?? statuses).map(({ value, label }) => ({ value, label: t(label) }))} />
              : field.json ? <Input.TextArea rows={3} /> : <Input />)}
          </Form.Item>)}
        </Form>
      </Modal>
    </section>
  )
}
