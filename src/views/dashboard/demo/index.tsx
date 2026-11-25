import { usePreferences } from '../../../settings/preferences'
import { ApartmentOutlined, AppstoreOutlined, ArrowRightOutlined, CalendarOutlined, LinkOutlined, LockOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Avatar, Button, Empty, Progress, Skeleton, Table, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../../../api/client'
import { getOverview } from '../../../api/modules/dashboard'
import type { DashboardOverview } from '../../../api/modules/dashboard'
import { appTitle } from '../../../config/app'
import type { MenuPage } from '../../../router/menu'
import { formatDate } from '../../../utils/datetime'
import './index.scss'

const management = [
  { key: 'users', component: 'system/user/index', title: 'userManagement', description: 'manageAccountsAndProfiles', label: 'totalUsers', icon: UserOutlined, tone: 'blue' },
  { key: 'roles', component: 'system/role/index', title: 'rolePermissions', description: 'assignRolesAndPermissions', label: 'totalRoles', icon: LockOutlined, tone: 'purple' },
  { key: 'departments', component: 'system/department/index', title: 'departmentManagement', description: 'organizeDepartmentsAndTeams', label: 'departments', icon: ApartmentOutlined, tone: 'teal' },
  { key: 'menus', component: 'system/menu/index', title: 'menuConfiguration', description: 'managePagesAndNavigation', label: 'accessiblePages', icon: AppstoreOutlined, tone: 'amber' }
] as const

export default function DemoDashboard({ displayName, pages, token, onExpired }: {
  displayName: string
  pages: MenuPage[]
  token: string
  onExpired: () => void
}) {
  const { preferences: { timeZone } } = usePreferences()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<DashboardOverview>()
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const language = i18n.resolvedLanguage
  const [now] = useState(() => new Date())
  const date = new Intl.DateTimeFormat(language, { month: 'long', day: 'numeric', weekday: 'long', timeZone }).format(now)
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone }).format(now))
  const greeting = t(hour < 6 ? 'workingLate' : hour < 12 ? 'goodMorning' : hour < 18 ? 'goodAfternoon' : 'goodEvening')

  useEffect(() => {
    const controller = new AbortController()
    getOverview(token, controller.signal).then((result) => {
      if (!controller.signal.aborted) setOverview(result)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else setFailed(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [token, attempt, onExpired])

  const users = overview?.users
  const number = new Intl.NumberFormat(language)
  const shortcuts = management.flatMap((item) => {
    const page = pages.find((page) => page.component === item.component)
    return page && (overview?.capabilities[item.key] ?? true) ? [{ ...item, path: page.path }] : []
  })
  const metrics = management.slice(0, 3).flatMap((item) => {
    if (item.key === 'menus' || !overview?.capabilities[item.key]) return []
    const entry = overview[item.key]
    return [{ ...item, value: entry?.total, unit: t(item.key === 'users' ? 'metricUserUnit' : 'metricItemUnit'),
      hint: item.key === 'users' ? t('userStatusCounts', { value: users?.enabled, value1: users?.disabled })
        : t(item.key === 'roles' ? 'enabledRoleCount' : 'enabledDepartmentCount', { value: entry?.enabled }) }]
  })
  const allMetrics = [...metrics, { key: 'pages', label: 'accessiblePages', icon: AppstoreOutlined, tone: 'amber', value: overview?.accessiblePages, unit: t('metricItemUnit'), hint: t('basedOnYourAccountPermissions') }]

  return (
    <section className="demo-dashboard">
      <div className="demo-dashboard__heading">
        <div><span className="page-eyebrow">OVERVIEW</span><h1>{t('workspace')}</h1><p>{t('startWithAnOverviewKeepEverydayManagementOrganized')}</p></div>
        <div className="demo-dashboard__date"><CalendarOutlined />{date}</div>
      </div>
      <div className="welcome-panel">
        <div className="welcome-panel__content">
          <span className="welcome-panel__eyebrow"><i />{t('welcomeTo', { value: appTitle })}</span>
          <h2>{t('greetingWithName', { value: greeting, value1: displayName })}<span className="welcome-panel__punctuation">{t('sentenceEnd')}</span></h2>
          <p>{t('yourTeamAccountsAndPermissionsInOnePlace')}<br />{t('startYourDayWithTheToolsYouKnow')}</p>
          <div className="welcome-panel__actions">
            {shortcuts[0] && <Button type="primary" onClick={() => navigate(shortcuts[0].path)}>{t('getStarted')}<ArrowRightOutlined /></Button>}
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => { setLoading(true); setFailed(false); setAttempt((value) => value + 1) }}>{t('refreshOverview')}</Button>
          </div>
        </div>
        <div className="welcome-panel__workspace" aria-label={t('currentWorkspace')}>
          <div className="workspace-card">
            <div className="workspace-card__top">
              <span className="workspace-card__symbol"><LinkOutlined /></span>
              <span className="workspace-card__status"><i />{t('signedIn')}</span>
            </div>
            <span className="workspace-card__label">{t('currentWorkspace')}</span><strong>{appTitle}</strong>
            <div className="workspace-card__account">
              <Avatar size={36}>{displayName.charAt(0)}</Avatar>
              <div><b>{overview?.account.isSuperAdmin ? t('superAdministrator') : overview?.account.roleNames.join(', ') || t('authorizedAccount')}</b>
                <span>{overview?.account.departmentName || t('everydayManagementOrganized')}</span></div>
            </div>
          </div>
          <span className="welcome-panel__orb welcome-panel__orb--one" />
          <span className="welcome-panel__orb welcome-panel__orb--two" />
        </div>
      </div>
      {failed && <Alert className="demo-dashboard__error" showIcon type="error" title={t(overview ? 'refreshFailedShowingTheLastLoadedOverview' : 'overviewUnavailableRefreshToTryAgain')} />}
      <div className="metric-grid">
        {allMetrics.map(({ key, label, icon: Icon, tone, value, unit, hint }) => (
          <article className="metric-card" key={key}>
            <div className="metric-card__top"><span>{t(label)}</span><span className={`tone-icon tone-${tone}`}><Icon /></span></div>
            <div className="metric-card__value">{loading && !overview ? <Skeleton active paragraph={false} /> : <>{value === undefined ? '—' : number.format(value)}<span>{unit}</span></>}</div>
            <p>{hint}</p>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--users">
          <header className="dashboard-panel__heading">
            <div><span className="section-kicker">{t('memberOverview')}</span><h2>{t(users ? 'recentlyAddedUsers' : 'accountAvailability')}</h2></div>
            {shortcuts.find((shortcut) => shortcut.key === 'users') && <Link to={shortcuts.find((shortcut) => shortcut.key === 'users')!.path}>{t('viewAll')} <ArrowRightOutlined /></Link>}
          </header>
          {users ? <>
            <Progress percent={users.total ? Math.round(users.enabled / users.total * 100) : 0} />
            <Table className="dashboard-users" rowKey="id" dataSource={users.recent} pagination={false} size="small" scroll={{ x: 440 }} columns={[
              { title: t('user'), dataIndex: 'displayName' },
              { title: t('department'), dataIndex: 'departmentName' },
              { title: t('status'), render: (_, row) => <Tag color={row.status === 1 ? 'green' : 'default'}>{t(row.status === 1 ? 'enabled' : 'disabled')}</Tag> },
              { title: t('createdAt'), render: (_, row) => formatDate(row.createdAt, timeZone).slice(0, 10) }
            ]} />
          </> : <p>{t('userListAccessHint')}</p>}
        </section>
        <section className="dashboard-panel dashboard-panel--quick">
          <header className="dashboard-panel__heading"><div><span className="section-kicker">{t('commonTools')}</span><h2>{t('quickAccess')}</h2></div></header>
          {shortcuts.length ? <div className="shortcut-grid">{shortcuts.map(({ path, title, description, icon: Icon, tone }) => (
            <Link className="shortcut" key={path} to={path}><span className={`tone-icon tone-${tone}`}><Icon /></span><strong>{t(title)}</strong><span>{t(description)}</span><ArrowRightOutlined className="shortcut__arrow" /></Link>
          ))}</div> : <Empty description={t('noManagementShortcutsAvailable')} />}
        </section>
        <section className="dashboard-panel dashboard-panel--distribution">
          <header className="dashboard-panel__heading"><div><span className="section-kicker">{t('organization')}</span><h2>{t(users ? 'usersByDepartment' : 'clearPermissionsOrganizedTeamwork')}</h2></div></header>
          {users ? <div className="distribution-list">{users.departments.slice(0, 5).map((group) => (
            <div className="distribution-item" key={group.id ?? 'unassigned'}><span>{group.id === null ? t('unassignedDepartment') : group.name}</span><Progress percent={users.total ? Math.round(group.count / users.total * 100) : 0} format={() => String(group.count)} /></div>
          ))}</div> : <p>{t('accessHelp')}</p>}
        </section>
      </div>
    </section>
  )
}
