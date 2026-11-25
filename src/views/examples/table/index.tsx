import { DownloadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Form, Input, InputNumber, Modal, Popconfirm, Popover, Select, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../../settings/preferences'
import { formatDate } from '../../../utils/datetime'

const categories = ['design', 'engineering', 'operations'] as const
const statuses = ['draft', 'active', 'completed'] as const
type TaskFields = { name: string; category: (typeof categories)[number]; status: (typeof statuses)[number]; budget: number }
type Task = TaskFields & { id: number; createdAt: number }
const initial: Task[] = Array.from({ length: 32 }, (_, index) => ({
  id: 32-index, name: `Workspace Iteration ${32-index}`, category: categories[index%3],
  status: statuses[index%3], createdAt: Date.UTC(2026,10,1-index), budget: 38400-index*1200
}))
const columnIds = ['name','category','status','budget','createdAt','actions'] as const

function formatCell(value: string | number) {
  const text = String(value)
  return '"' + (/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"','""') + '"'
}

export default function TableExample() {
  const { preferences: { timeZone } } = usePreferences()
  const { t } = useTranslation()
  const [rows,setRows]=useState(initial)
  const [selected,setSelected]=useState<number[]>([])
  const [filters,setFilters]=useState<{keyword?:string;category?:string;status?:string}>({})
  const [editor,setEditor]=useState<Task | null>()
  const [failed,setFailed]=useState(false)
  const [size,setSize]=useState<TableProps<Task>['size']>('middle')
  const [columns,setColumns]=useState<string[]>([...columnIds])
  const [search]=Form.useForm<typeof filters>()
  const [edit]=Form.useForm<TaskFields>()

  const visible=rows.filter(row=>(!filters.status||row.status===filters.status)&&(!filters.category||row.category===filters.category)&&
    [row.name,`TASK-${String(row.id).padStart(3,'0')}`].some(value=>value.toLowerCase().includes(filters.keyword?.trim().toLowerCase()??'')))
  function open(row:Task|null) {
    setEditor(row)
    edit.setFieldsValue(row ?? {name:'',category:'engineering',status:'draft',budget:0})
  }
  function save(fields:TaskFields) {
    if(editor) setRows(rows.map(row=>row.id===editor.id?{...row,...fields}:row))
    else setRows([{...fields,id:Math.max(0,...rows.map(row=>row.id))+1,createdAt:Date.now()},...rows])
    setEditor(undefined)
  }
  function remove(ids:number[]) {
    setRows(rows.filter(row=>!ids.includes(row.id)))
    setSelected(selected.filter(id=>!ids.includes(id)))
  }
  function exportCsv() {
    const items=selected.length?visible.filter(row=>selected.includes(row.id)):visible
    const contents=['id,name,category,status,budget',...items.map(row=>[row.id,row.name,row.category,row.status,row.budget].map(formatCell).join(','))].join('\r\n')
    const url=URL.createObjectURL(new Blob(['\uFEFF',contents],{type:'text/csv;charset=utf-8'}))
    const link=document.createElement('a')
    link.href=url
    link.download='tasks.csv'
    link.click()
    window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const label=(key:string)=>t(key==='createdAt'||key==='status'||key==='actions'?key:'table:'+key)
  const options=(items:readonly string[])=>items.map(value=>({value,label:t('table:'+value)}))

  return <section className="management">
    <div className="management__heading"><div><small>{t('table:eyebrow')}</small><h1>{t('tableExample')}</h1><p>{t('table:description')}</p></div>
      <Button type="primary" icon={<PlusOutlined />} onClick={()=>open(null)}>{t('table:addTask')}</Button>
    </div>
    <Alert type="info" title={t('table:localNotice')} />
    <Form form={search} layout="vertical" className="management__filters task-example__filters"
      onFinish={(value)=>{setFilters(value);setSelected([])}}>
      <Form.Item name="keyword" label={t('keyword')}><Input placeholder={t('table:searchPlaceholder')} allowClear /></Form.Item>
      <Form.Item name="category" label={t('table:category')}><Select allowClear placeholder={t('table:allCategories')} options={options(categories)} /></Form.Item>
      <Form.Item name="status" label={t('status')}><Select allowClear placeholder={t('allStatuses')} options={options(statuses)} /></Form.Item>
      <Space wrap><Button type="primary" htmlType="submit">{t('search')}</Button><Button onClick={()=>{
        search.resetFields();setFilters({});setSelected([])
      }}>{t('reset')}</Button></Space>
    </Form>
    <Card title={<Space>{t('table:taskList')}<Tag>{t('table:totalRows',{count:visible.length})}</Tag></Space>}
      extra={<Space wrap>
        <Button icon={<DownloadOutlined />} disabled={!visible.length||failed} onClick={exportCsv}>{t(selected.length?'table:exportSelected':'table:exportFiltered')}</Button>
        <Popconfirm title={t('table:deleteConfirm',{count:selected.length})} onConfirm={()=>remove(selected)}>
          <Button danger disabled={!selected.length||failed}>{t('table:deleteSelected')}</Button>
        </Popconfirm>
        <Select aria-label={t('table:density')} value={size} onChange={setSize} options={[
          {value:'large',label:t('large')},{value:'middle',label:t('default')},{value:'small',label:t('small')}
        ]} />
        <Popover title={t('table:columns')} trigger="click" content={<Checkbox.Group value={columns}
          options={columnIds.map(value=>({value,label:label(value)}))} onChange={(values)=>setColumns(values.length?values:columns)} />}>
          <Button>{t('table:columns')}</Button>
        </Popover>
        <Button icon={<ReloadOutlined />} aria-label={t('refresh')} onClick={()=>setFailed(false)} />
      </Space>}>
      {failed ? <Alert type="error" title={t('table:loadFailed')} action={<Button onClick={()=>setFailed(false)}>{t('tryAgain')}</Button>} /> :
      <Table<Task> rowKey="id" bordered size={size} scroll={{ x: 640 }} pagination={{defaultPageSize:10,placement:['bottomCenter'],showSizeChanger:true}}
        dataSource={visible} rowSelection={{selectedRowKeys:selected,onChange:keys=>setSelected(keys.map(Number))}}
        columns={([
          {key:'name',title:label('name'),render:(_:unknown,row:Task)=><>{row.name}<br /><small>TASK-{String(row.id).padStart(3,'0')}</small></>,sorter:(a:Task,b:Task)=>a.name.localeCompare(b.name)},
          {key:'category',title:label('category'),render:(_:unknown,row:Task)=>t('table:'+row.category)},
          {key:'status',title:label('status'),render:(_:unknown,row:Task)=><Tag>{t('table:'+row.status)}</Tag>},
          {key:'budget',title:label('budget'),dataIndex:'budget',sorter:(a:Task,b:Task)=>a.budget-b.budget},
          {key:'createdAt',title:label('createdAt'),render:(_:unknown,row:Task)=>formatDate(row.createdAt,timeZone),sorter:(a:Task,b:Task)=>a.createdAt-b.createdAt},
          {key:'actions',title:label('actions'),render:(_:unknown,row:Task)=><Space>
            <Button type="link" onClick={()=>open(row)}>{t('edit')}</Button>
            <Popconfirm title={t('confirmDeletion')} onConfirm={()=>remove([row.id])}><Button danger type="link">{t('delete')}</Button></Popconfirm>
          </Space>}
        ]).filter(column=>columns.includes(column.key))} />}
    </Card>
    <p>{t('table:failureHint')} <Button type="link" onClick={()=>setFailed(true)}>{t('table:simulateFailure')}</Button></p>
    <Modal open={editor!==undefined} title={t(editor?'table:editTask':'table:addTask')} onCancel={()=>setEditor(undefined)} onOk={()=>edit.submit()}>
      <Form form={edit} layout="vertical" onFinish={save}>
        <Form.Item name="name" label={label('name')} rules={[{required:true,whitespace:true}]}><Input /></Form.Item>
        <Form.Item name="category" label={label('category')} rules={[{required:true}]}><Select options={options(categories)} /></Form.Item>
        <Form.Item name="status" label={label('status')} rules={[{required:true}]}><Select options={options(statuses)} /></Form.Item>
        <Form.Item name="budget" label={label('budget')} rules={[{required:true}]}><InputNumber min={0} max={10000000} /></Form.Item>
      </Form>
    </Modal>
  </section>
}
