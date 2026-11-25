import { usePreferences } from '../../../settings/preferences'
import { SearchOutlined } from '@ant-design/icons'
import { Alert, Button, DatePicker, Descriptions, Input, Modal, Select, Table, Tag } from 'antd'
import type { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../../api/client'
import { formatDate, parseWallTime, pickerWallTime } from '../../../utils/datetime'

import './index.scss'

const actions = ['password_reset', 'totp_enable', 'totp_disable', 'role_grant', 'session_revoke'] as const
const results = ['success', 'failure'] as const
const relatedEndpoints: Record<(typeof actions)[number], string[]> = {
  password_reset: ['POST /system/users/:id/password'],
  totp_enable: ['POST /auth/totp/enable', 'POST /system/users/:id/totp/setup'],
  totp_disable: ['POST /auth/totp/disable', 'POST /system/users/:id/totp/disable'],
  role_grant: ['PUT /system/roles/:id/menus'],
  session_revoke: ['DELETE /system/users/:id/sessions/:sessionId']
}

interface AuditEntry {
  id: number
  action: (typeof actions)[number]
  result: (typeof results)[number]
  targetType: 'user' | 'role'
  actorId: number
  targetId: number
  createdAt: number
  statusCode: number
}

export default function AuditLog({ token, onExpired }: { token: string; onExpired: () => void }) {
  const { preferences: { timeZone } } = usePreferences()
  const { t } = useTranslation(['auditLog', 'ui', 'routes'])
  const [action, setAction] = useState<string>()
  const [result, setResult] = useState<string>()
  const [timeRange, setTimeRange] = useState<[number | null, number | null] | null>(null)
  const [invalidRange, setInvalidRange] = useState(false)
  const [pickerRevision, setPickerRevision] = useState(0)
  const [query, setQuery] = useState<Record<string, string | number>>({ page: 1, pageSize: 10 })
  const [records, setRecords] = useState<{ list: AuditEntry[]; total: number }>({ list: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [validation, setValidation] = useState('')
  const [details, setDetails] = useState<AuditEntry>()

  useEffect(() => {
    const controller = new AbortController()
    request<{ list: AuditEntry[]; total: number }>('/system/audit-logs', {
      token, query, signal: controller.signal
    }).then((data) => {
      if (!controller.signal.aborted) setRecords(data)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002'))
        onExpired()
      else setLoadError(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [token, query, onExpired])

  function load(next: Record<string, string | number>) {
    setLoading(true)
    setLoadError(false)
    setQuery(next)
  }

  const fields = (entry: AuditEntry) => [
    { key: 'action', label: t('action'), value: t(`action_${entry.action}`) },
    { key: 'result', label: t('result'), value: <Tag color={entry.result === 'success' ? 'green' : 'red'}>{t(`result_${entry.result}`)}</Tag> },
    { key: 'actorId', label: t('actorId'), value: entry.actorId },
    { key: 'targetType', label: t('targetType'), value: t(`target_${entry.targetType}`) },
    { key: 'targetId', label: t('targetId'), value: entry.targetId },
    { key: 'statusCode', label: t('statusCode'), value: entry.statusCode },
    { key: 'createdAt', label: t('createdAt'), value: formatDate(entry.createdAt, timeZone) }
  ]

  return (
    <section className="management">
      <div className="management__heading"><h1>{t('routes:SystemAuditLog')}</h1></div>
      <form className="filters" onSubmit={(event) => {
        event.preventDefault()
        setValidation('')
        const data = new FormData(event.currentTarget)
        const next: Record<string, string | number> = { page: 1, pageSize: query.pageSize }
        if (action) next.action = action
        if (result) next.result = result
        for (const key of ['actorId', 'targetId']) {
          const value = String(data.get(key) ?? '').trim()
          if (!value) continue
          if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
            setValidation('invalidId')
            return
          }
          next[key] = Number(value)
        }
        if (invalidRange) {
          setValidation('invalidTimeRange')
          return
        }
        const [start, end] = timeRange ?? []
        if (start != null) next.createdFrom = start
        if (end != null) next.createdTo = end
        load(next)
      }} onReset={() => {
        setAction(undefined)
        setResult(undefined)
        setTimeRange(null)
        setInvalidRange(false)
        setPickerRevision((value) => value + 1)
        setValidation('')
        load({ page: 1, pageSize: query.pageSize })
      }}>
        <label>{t('action')}<Select aria-label={t('action')} allowClear value={action} onChange={setAction} placeholder={t('allActions')} options={actions.map((value) => ({ value, label: t(`action_${value}`) }))} /></label>
        <label>{t('result')}<Select aria-label={t('result')} allowClear value={result} onChange={setResult} placeholder={t('allResults')} options={results.map((value) => ({ value, label: t(`result_${value}`) }))} /></label>
        <label>{t('actorId')}<Input name="actorId" inputMode="numeric" /></label>
        <label>{t('targetId')}<Input name="targetId" inputMode="numeric" /></label>
        <div className="audit-time-range" role="group" aria-labelledby="audit-time-range-label">
          <label id="audit-time-range-label" htmlFor="audit-time-start">{t('timeRange')} · {timeZone}</label>
          <DatePicker.RangePicker
            key={`${timeZone}:${pickerRevision}`}
            id={{ start: 'audit-time-start', end: 'audit-time-end' }}
            placeholder={[t('timeStart'), t('timeEnd')]}
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            allowEmpty={[true, true]}
            value={timeRange && [
              timeRange[0] === null ? null : pickerWallTime(timeRange[0], timeZone),
              timeRange[1] === null ? null : pickerWallTime(timeRange[1], timeZone)
            ]}
            onChange={(value) => {
              const toTimestamp = (date: Dayjs | null | undefined) =>
                date == null ? null : parseWallTime(date.format('YYYY-MM-DD HH:mm:ss') + '.000', timeZone)
              const start = toTimestamp(value?.[0])
              const end = toTimestamp(value?.[1])
              const invalid = (value?.[0] != null && (start === null || start < 0)) ||
                (value?.[1] != null && (end === null || end < 0)) ||
                (start !== null && end !== null && start >= end)
              setInvalidRange(invalid)
              setValidation(invalid ? 'invalidTimeRange' : '')
              if (invalid) setPickerRevision((revision) => revision + 1)
              else setTimeRange(value ? [start, end] : null)
            }}
          />
        </div>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('ui:search')}</Button>
        <Button htmlType="reset">{t('ui:reset')}</Button>
      </form>
      {validation && <Alert type="error" title={t(validation)} />}
      {loadError && <Alert type="error" title={t('loadFailed')} action={<Button onClick={() => load({ ...query })}>{t('ui:tryAgain')}</Button>} />}
      <div className="management__card">
        <div className="management__toolbar"><h2>{t('records')}</h2></div>
        <Table<AuditEntry> rowKey="id" bordered scroll={{ x: 'max-content' }} loading={loading} dataSource={records.list}
          locale={{ emptyText: t('empty') }}
          columns={[
            ...['action', 'result', 'actorId', 'targetType', 'targetId', 'statusCode', 'createdAt'].map((key) => ({
              key, title: t(key), render: (_: unknown, entry: AuditEntry) => fields(entry).find((field) => field.key === key)?.value
            })),
            { key: 'details', title: t('ui:actions'), render: (_, entry) => <Button type="link" onClick={() => setDetails(entry)}>{t('details')}</Button> }
          ]}
          pagination={{ current: Number(query.page), pageSize: Number(query.pageSize), total: records.total, placement: ['bottomCenter'], showSizeChanger: true,
            onChange: (page, pageSize) => load({ ...query, page: query.pageSize === pageSize ? page : 1, pageSize })
          }}
        />
      </div>
      <Modal title={t('detailsTitle')} open={Boolean(details)} footer={null} onCancel={() => setDetails(undefined)}>
        {details && <Descriptions column={1} items={[
          { key: 'id', label: t('recordId'), children: details.id },
          ...fields(details).map(({ value, ...field }) => ({ ...field, children: value })),
          { key: 'endpoints', label: t('relatedEndpoints'), children: relatedEndpoints[details.action]?.map((endpoint) => <div key={endpoint}><code>{endpoint}</code></div>) }
        ]} />}
      </Modal>
    </section>
  )
}
