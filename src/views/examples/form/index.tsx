import { Alert, Button, Card, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Steps, Switch, Upload } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { PageProps } from '../../../components/ManagementPage'

const categories = ['design', 'engineering', 'operations'] as const
const owners = {
  design: ['Alex', 'Jordan'],
  engineering: ['Taylor', 'Morgan'],
  operations: ['Casey', 'Jamie']
}
const members = Object.values(owners).flat()

export default function FormExample({ user }: PageProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false)
  const [attachments, setAttachments] = useState<import('antd').UploadFile[]>([])
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    dirty && currentLocation.pathname !== nextLocation.pathname
  )
  useBeforeUnload(useCallback((event) => {
    if (!dirty) return
    event.preventDefault()
    event.returnValue = ''
  }, [dirty]))
  const [form] = Form.useForm()
  const category = Form.useWatch('category', form) as (typeof categories)[number] | undefined
  const notify = Form.useWatch('notify', form) as boolean | undefined
  const key = `npora-react-form:${user.id}`
  const [initial] = useState(() => {
    try {
      const { dateRange, ...draft } = JSON.parse(localStorage.getItem(key) ?? '{}')
      return { category: categories[0], ...draft, dates: Array.isArray(dateRange) ? dateRange.map((value) => value ? dayjs(value) : null) : undefined }
    }
    catch { return { category: categories[0] } }
  })
  const steps = ['basic', 'plan', 'review']
  return <section className="management">
    <div className="management__heading"><div><small>{t('routes:Examples')}</small><h1>{t('form:title')}</h1><p>{t('form:description')}</p></div></div>
    <Modal open={blocker.state === 'blocked'} title={t('form:leaveConfirm')}
      okText={t('form:leave')} cancelText={t('form:stay')}
      onOk={() => { if (blocker.state === 'blocked') { setDirty(false); blocker.proceed() } }}
      onCancel={() => { if (blocker.state === 'blocked') blocker.reset() }} />
    <Alert type="info" title={t('form:localNotice')} />
    <Card className="example-card">
      <Steps current={step} items={steps.map((value) => ({title:t('form:'+value)}))} />
      <Form layout="vertical" form={form} initialValues={initial} onValuesChange={(changed) => {
        setDirty(true)
        if ('category' in changed) form.setFieldValue('owner',undefined)
      }}>
        <div className="example-form">
          <h2>{t('form:'+steps[step])}</h2><p>{t('form:'+steps[step]+'Hint')}</p>
          <div hidden={step !== 0}>
            <Form.Item name="name" label={t('form:name')} rules={[{required:true,whitespace:true,max:100}]}><Input maxLength={100} showCount /></Form.Item>
            <Form.Item name="category" label={t('table:category')} rules={[{required:true}]}><Select options={categories.map((value)=>({value,label:t('table:'+value)}))} /></Form.Item>
            <Form.Item name="owner" label={t('form:owner')} rules={[{required:true}]}><Select placeholder={t('form:ownerPlaceholder')} options={(owners[category ?? categories[0]] ?? []).map(value=>({value}))} /></Form.Item>
            <Form.Item name="description" label={t('description')}><Input.TextArea maxLength={500} showCount /></Form.Item>
          </div>
          <div hidden={step !== 1}>
            <Form.Item name="dates" label={t('form:dates')} rules={[{required:true,message:t('form:dateRule')}]}><DatePicker.RangePicker /></Form.Item>
            <Form.Item name="budget" label={t('table:budget')}><InputNumber min={0} max={10000000} /></Form.Item>
            <Form.Item name="priority" label={t('form:priority')}><Select options={['low','normal','high'].map((value)=>({value,label:t('form:'+value)}))} /></Form.Item>
            <Form.Item name="members" label={t('form:members')}><Select mode="multiple" maxCount={5}
              options={members.map(value=>({value}))} /></Form.Item>
            <Form.Item name="notify" label={t('form:notifications')} valuePropName="checked"><Switch /></Form.Item>
            {notify && <Form.Item name="email" label={t('email')} rules={[{type:'email',required:true,message:t('form:emailRule')}]}><Input maxLength={255} /></Form.Item>}
            <Form.Item label={t('form:attachments')} extra={t('form:attachmentHint')}>
              <Upload fileList={attachments} accept=".pdf,.png,.jpg,.jpeg,.txt" maxCount={3}
                beforeUpload={file=>{
                  if(!/\.(?:pdf|png|jpe?g|txt)$/i.test(file.name)||file.size>2*1024*1024){
                    setMessage(t('form:attachmentRule'));return Upload.LIST_IGNORE
                  }
                  return false
                }} onChange={({fileList})=>{setAttachments(fileList);setDirty(true)}}>
                <Button>{t('form:chooseFiles')}</Button>
              </Upload>
            </Form.Item>
          </div>
          <div hidden={step !== 2}>
            <p>{form.getFieldValue('name')} · {form.getFieldValue('owner')}</p>
            <Form.Item name="agreed" valuePropName="checked"><Checkbox>{t('form:agreement')}</Checkbox></Form.Item>
          </div>
          {message && <Alert title={message} />}
          <Space wrap>
            {step > 0 && <Button onClick={()=>setStep(step-1)}>{t('form:previous')}</Button>}
            <Button type="primary" onClick={async ()=>{
              if(step===2){
                if(!form.getFieldValue('agreed')) { setMessage(t('form:agreementRule')); return }
                localStorage.removeItem(key)
                setMessage(t('form:submitted'))
                setDirty(false)
                return
              }
              const fields=step===0?['name','category','owner','description']:['dates','budget','priority','members',...(notify?['email']:[])]
              if(await form.validateFields(fields).catch(()=>null)) { setMessage(''); setStep(step+1) }
            }}>{t(step===2?'form:submit':'form:next')}</Button>
            <Button onClick={()=>{
              const { dates, ...values }=form.getFieldsValue(true)
              if(dates) values.dateRange=dates.map((date: { format: (pattern:string)=>string } | null)=>date?.format('YYYY-MM-DD'))
              localStorage.setItem(key,JSON.stringify(values));setMessage(t('form:draftSaved'));setDirty(false)
            }}>{t('form:saveDraft')}</Button>
            <Button onClick={()=>{
              if(!window.confirm(t('form:resetConfirm'))) return
              localStorage.removeItem(key)
              form.resetFields()
              form.setFieldsValue({name:'',category:categories[0],owner:undefined,description:'',dates:undefined,
                budget:undefined,priority:undefined,members:[],notify:false,email:'',agreed:false})
              setAttachments([]);setStep(0);setMessage('');setDirty(false)
            }}>{t('reset')}</Button>
          </Space>
        </div>
      </Form>
    </Card>
  </section>
}
