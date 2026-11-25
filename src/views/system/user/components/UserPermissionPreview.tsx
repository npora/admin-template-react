import { Alert, Table } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../../../api/client'

interface Preview {
  roles: { id: number; name: string }[]
  entries: { id: number; parentId: number | null; title: string; permission: string | null; roleIds: number[]; source: 'role' | 'inherited' | 'superAdmin' }[]
}
export default function UserPermissionPreview({token,id,onExpired}: {token:string;id:number;onExpired:()=>void}) {
  const {t}=useTranslation()
  const [preview,setPreview]=useState<Preview>()
  const [error,setError]=useState(false)
  useEffect(()=>{
    const controller=new AbortController()
    request<Preview>(`/system/users/${id}/permission-preview`,{token,signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setPreview(data)
    }).catch((reason:unknown)=>{
      if(controller.signal.aborted)return
      if(reason instanceof ApiError&&(reason.status===401||String(reason.code)==='10002'))onExpired()
      else setError(true)
    })
    return ()=>controller.abort()
  },[token,id,onExpired])
  const sources={role:'permissionSourceRole',inherited:'permissionSourceInherited',superAdmin:'superAdministrator'}
  return <>
    {error&&<Alert type="error" title={t('tryAgain')} />}
    <Table<Preview['entries'][number]> rowKey="id" loading={!preview&&!error} dataSource={preview?.entries} size="middle"
      columns={[
        {title:t('name'),dataIndex:'title'}, {title:t('permissionCode'),dataIndex:'permission'},
        {title:t('permissionSource'),render:(_,row)=>t(sources[row.source])},
        {title:t('roleLabel'),render:(_,row)=>row.roleIds.map(id=>preview?.roles.find(role=>role.id===id)?.name).filter(Boolean).join(' · ')}
      ]} />
  </>
}
