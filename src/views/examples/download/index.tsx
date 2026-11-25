import { DownloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card } from 'antd'
import { useTranslation } from 'react-i18next'

const records = [{ id: 1, name: 'Workspace iteration', status: 'active' }, { id: 2, name: 'Account review', status: 'completed' }]

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function DownloadExample() {
  const { t } = useTranslation()
  return <section className="management">
    <div className="management__heading"><div><small>{t('routes:Examples')}</small><h1>{t('routes:SystemDownload')}</h1><p>{t('table:downloadDescription')}</p></div></div>
    <Alert type="info" title={t('table:downloadNotice', { defaultValue: t('table:csvTitle') })} />
    <div className="example-grid">
      <Card title={t('table:csvTitle')}><p>{t('table:csvDescription')}</p><Button type="primary" icon={<DownloadOutlined />} onClick={() => download('tasks.csv', '\uFEFFid,name,status\r\n'+records.map((r)=>[r.id,r.name,r.status].join(',')).join('\r\n'), 'text/csv;charset=utf-8')}>{t('table:downloadCsv')}</Button></Card>
      <Card title={t('table:jsonTitle')}><p>{t('table:jsonDescription')}</p><Button icon={<DownloadOutlined />} onClick={() => download('tasks.json', JSON.stringify(records,null,2), 'application/json')}>{t('table:downloadJson')}</Button></Card>
    </div>
  </section>
}
