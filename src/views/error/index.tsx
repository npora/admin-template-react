import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { finishStartup } from '../../startup'
import { useTranslation } from 'react-i18next'
import './index.scss'

export default function RouteError({ forbidden }: { forbidden: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useEffect(finishStartup, [])
  return (
    <main className="route-error">
      <Result status="warning"
        title={<h1>{forbidden ? t('forbiddenTitle') : '404'}</h1>}
        subTitle={t(forbidden ? 'forbiddenDescription' : 'thisPageDoesNotExist')}
        extra={<Button type="primary" onClick={() => navigate('/dashboard', { replace:true })}>{t('backToDashboard')}</Button>}
      />
    </main>
  )
}
