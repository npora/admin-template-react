import { Alert, Button, Popconfirm, Table, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../api/client'
import { usePreferences } from '../../settings/preferences'
import { formatDate } from '../../utils/datetime'
import { useAccountRequest } from '../AccountSecurity/useAccountRequest'

interface Entry { id: string; createdAt: number; expiresAt: number; current: boolean }

export default function SessionList({ token, endpoint, onExpired, own = false, revoke }: {
  token: string
  endpoint: string
  onExpired: () => void
  own?: boolean
  revoke: boolean
}) {
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const [entries,setEntries] = useState<Entry[]>([])
  const [attempt,setAttempt] = useState(0)
  const [loading,setLoading] = useState(true)
  const [loadError,setLoadError] = useState('')
  const { busy,error,run } = useAccountRequest(token,onExpired)
  useEffect(()=>{
    const controller=new AbortController()
    request<Entry[]>(endpoint,{token,signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setEntries(data)
    }).catch((reason:unknown)=>{
      if(controller.signal.aborted)return
      if(reason instanceof ApiError&&(reason.status===401||String(reason.code)==='10002'))onExpired()
      else setLoadError(t(reason instanceof ApiError&&reason.status===404?'profile:sessionsUnavailable':'profile:sessionsLoadFailed'))
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[token,endpoint,attempt,onExpired,t])
  function remove(id:string){
    return run(endpoint+'/'+encodeURIComponent(id),{method:'DELETE'},()=>{
      setLoading(true)
      setAttempt(value=>value+1)
    })
  }
  return <>
    {loadError&&<Alert type="warning" title={loadError} action={<Button onClick={()=>{
      setLoadError('');setLoading(true);setAttempt(value=>value+1)
    }}>{t('tryAgain')}</Button>} />}
    {error&&<Alert type="error" title={error} />}
    {own&&revoke&&entries.some(row=>!row.current)&&<Popconfirm title={t('profile:sessionsConfirmOthers')} onConfirm={()=>remove('others')}>
      <Button disabled={busy}>{t('profile:sessionsRevokeOthers')}</Button>
    </Popconfirm>}
    <Table<Entry> rowKey="id" loading={loading} dataSource={entries} pagination={false} size="middle"
      locale={{emptyText:t('profile:sessionsEmpty')}} columns={[
        {title:t('profile:sessionsStatus'),render:(_,row)=><Tag>{t(row.current?'profile:sessionsCurrent':'profile:sessionsOther')}</Tag>},
        {title:t('profile:sessionsCreatedAt'),render:(_,row)=>formatDate(row.createdAt,preferences.timeZone)},
        {title:t('profile:sessionsExpiresAt'),render:(_,row)=>formatDate(row.expiresAt,preferences.timeZone)},
        ...(revoke?[{title:t('profile:sessionsActions'),render:(_:unknown,row:Entry)=>!row.current&&
          <Popconfirm title={t('profile:sessionsConfirmOne')} onConfirm={()=>remove(row.id)}>
            <Button type="link" danger disabled={busy}>{t('profile:sessionsRevoke')}</Button>
          </Popconfirm>}]:[])
      ]} />
  </>
}
