import { ArrowRightOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { appTitle } from '../../config/app'
import type { MenuPage } from '../../router/menu'

export default function Dashboard({ displayName, pages }: { displayName: string; pages: MenuPage[] }) {
  const { t } = useTranslation()
  const userPages = pages.filter((page) => page.component === 'system/user/index')

  return (
    <section className="dashboard">
      <div className="dashboard__welcome">
        <span>{appTitle}</span>
        <h1>{t('welcomeBack')} · {displayName}</h1>
        <p>现代、轻量、易扩展的 React 后台管理脚手架</p>
      </div>
      {userPages.length > 0 && (
        <div className="dashboard__entries">
          {userPages.map((page) => (
            <Link className="dashboard__entry" key={page.path} to={page.path}>
              <span>
                <strong><UserOutlined /> {page.title}</strong>
                <small>{t('manageAccountsAndProfiles')}</small>
              </span>
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
