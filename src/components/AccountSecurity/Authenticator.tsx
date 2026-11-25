import { Alert, Button, Form, Input, Spin, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../api/client'
import { useAccountRequest } from './useAccountRequest'

interface Status { available: boolean; enabled: boolean }
interface Setup { secret: string; uri: string }
type Values = { password: string; code: string }

export default function Authenticator({ token, endpoint, administrator = false, onExpired, onChanged }: {
  token: string
  endpoint: string
  administrator?: boolean
  onExpired: () => void
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [status,setStatus]=useState<Status>()
  const [loadError,setLoadError]=useState(false)
  const [setup,setSetup]=useState<Setup>()
  const [form]=Form.useForm<Values>()
  const { busy, error, run } = useAccountRequest(token,onExpired)
  useEffect(()=>{
    const controller=new AbortController()
    request<Status>(endpoint,{token,signal:controller.signal}).then(value=>{
      if(!controller.signal.aborted)setStatus(value)
    }).catch((error:unknown)=>{
      if(controller.signal.aborted)return
      if(error instanceof ApiError&&(error.status===401||String(error.code)==='10002'))onExpired()
      else setLoadError(true)
    })
    return ()=>controller.abort()
  },[endpoint,token,onExpired])
  if(loadError)return <Alert type="warning" title={t('authenticatorUnavailable')} />
  if(!status)return <Spin />
  if(!status.available)return <Alert type="info" title={t('authenticatorUnavailable')} />

  function submit({password,code}:Values){
    if(status?.enabled){
      void run(endpoint+'/disable',{json:{password,code}},()=>{
        setStatus({available:true,enabled:false})
        form.resetFields()
        onChanged()
      })
    }else if(setup){
      void run(endpoint+'/enable',{json:{password,code}},()=>{
        setSetup(undefined)
        setStatus({available:true,enabled:true})
        form.resetFields()
        onChanged()
      })
    }else{
      void run<Setup>(endpoint+'/setup',{json:{password}},value=>{
        form.resetFields()
        setSetup(value)
        if(administrator)setStatus({available:true,enabled:true})
      })
    }
  }

  return <>
    <p>{t('authenticatorDescription')}</p>
    <Tag color={status.enabled?'green':'default'}>{t(status.enabled?'authenticatorBound':'authenticatorUnbound')}</Tag>
    {setup && <Alert type="info" title={t('authenticatorSecret')}
      description={<><p>{t('authenticatorSetupHint')}</p><Typography.Text copyable code>{setup.secret}</Typography.Text></>} />}
    {setup && administrator ? <Button onClick={()=>{setSetup(undefined);onChanged()}}>{t('authenticatorSaved')}</Button> :
    <Form form={form} layout="vertical" disabled={busy} onFinish={submit}>
      <Form.Item name="password" label={t(administrator?'administratorPassword':'password')} rules={[{required:true}]}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      {(status.enabled||setup)&&<Form.Item name="code" label={t('authenticatorCode')} rules={[{required:true,pattern:/^[0-9]{6}$/}]}>
        <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
      </Form.Item>}
      {error&&<Alert type="error" title={error} />}
      <Button type="primary" htmlType="submit" loading={busy}>{t(status.enabled?'authenticatorDisable':setup?'authenticatorEnable':'authenticatorStart')}</Button>
    </Form>}
  </>
}
