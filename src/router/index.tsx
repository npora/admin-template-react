import { clearScreenLock } from '../layout/screen-lock'
import { finishStartup } from '../startup'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api/client'
import { saveCredential, storedCredential } from '../auth/credential'
import { can } from '../auth/permissions'
import type { Session } from '../auth/types'
import Layout from '../layout'
import Dashboard from '../views/dashboard'
import RouteError from '../views/error'
import Login from '../views/login'
import { collectPages } from './menu'
import { getSystemPage, systemPages } from './system-pages'

const Profile = lazy(() => import('../views/profile'))
const PasswordRecovery = lazy(() => import('../views/forgot-password'))

export default function AppRouter() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [credential, setCredential] = useState(storedCredential)
  const [session, setSession] = useState<Session>()
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [returnTo, setReturnTo] = useState('/')
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [expire] = useState(() => () => {
    clearScreenLock()
    saveCredential(null)
    setCredential(null)
    setSession(undefined)
  })

  useEffect(() => {
    if (!credential || session) return
    const controller = new AbortController()
    api
      .session(credential.token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSession(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002'))
          expire()
        else setLoadError(true)
      })
    return () => controller.abort()
  }, [credential, session, attempt, expire])

  async function refreshAuthorization(token: string) {
    if (refreshing) return
    setRefreshing(true)
    try {
      const data = await api.session(token)
      setSession((previous) => previous === session ? data : previous)
    } catch (error) {
      if (storedCredential()?.token === token && error instanceof ApiError &&
        (error.status === 401 || String(error.code) === '10002')) expire()
    } finally {
      setRefreshing(false)
    }
  }

  async function logout(token: string) {
    if (loggingOut || storedCredential()?.token !== token) return
    setLoggingOut(true)
    setLogoutError(false)
    try {
      await api.logout(token)
      expire()
      void navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) {
        expire()
        void navigate('/login', { replace: true })
      } else setLogoutError(true)
    } finally {
      setLoggingOut(false)
    }
  }

  useEffect(() => {
    if (!credential || loadError || location.pathname === '/forgot-password' || location.pathname === '/404') finishStartup()
  }, [credential, loadError, location.pathname])

  if (location.pathname === '/404') return <RouteError forbidden={false} />

  if (location.pathname === '/forgot-password')
    return (
      <Suspense fallback={<main className="login" role="status">正在加载页面…</main>}>
        <PasswordRecovery onReset={expire} />
      </Suspense>
    )

  if (!credential)
    return (
      <Login
        onLogin={(next, data, remember) => {
          setReturnTo(location.pathname === '/login' ? '/' : location.pathname + location.search)
          saveCredential(next, remember)
          setLoadError(false)
          setSession(data)
          setCredential(next)
        }}
      />
    )

  if (!session)
    return (
      <main className="login">
        {loadError ? (
          <div className="panel">
            <p role="alert">加载会话失败</p>
            <Button
              onClick={() => {
                setLoadError(false)
                setAttempt((value) => value + 1)
              }}
            >
              重试
            </Button>
          </div>
        ) : (
          <p role="status">正在恢复会话…</p>
        )}
      </main>
    )

  if (location.pathname === '/login') return <Navigate replace to={returnTo} />
  const menus = collectPages(session.routes, '', [], false, (node) =>
    node.name && i18n.getFixedT('zh-CN', 'routes')(node.name) === node.title
      ? t(`routes:${node.name}`, { defaultValue: node.title })
      : node.title
  )
  const pages = menus.flatMap((menu) => {
    const definition = getSystemPage(menu.component)
    return definition ? [{ ...menu, definition }] : []
  })
  const visiblePages = pages.filter(
    (page) => !page.hidden && (!page.definition.permission || can(session.user, page.definition.permission))
  )
  const current = pages.find((page) => page.path === location.pathname)
  const CurrentPage = location.pathname === '/profile' ? Profile
    : current && (!current.definition.permission || can(session.user, current.definition.permission))
      ? current.definition.page
      : undefined
  if (location.pathname === '/') return <Navigate replace to={'/dashboard' + location.search} />
  const home = location.pathname === '/dashboard'
  const denied = Boolean(current) || Object.values(systemPages).some(
    ({ path }) => path === location.pathname
  )

  if (!home && !CurrentPage) return <RouteError forbidden={denied} />

  const displayName = session.user.displayName || session.user.username
  const token = credential.token
  const account = session.user
  function renderPage(path: string) {
    if (path === '/dashboard') return <Dashboard displayName={displayName} pages={visiblePages} />
    if (path === '/profile') return <Profile token={token} user={account} onExpired={expire} />
    const available = pages.find((page) => page.path === path && (!page.definition.permission || can(account, page.definition.permission)))
    const Page = available?.definition.page
    return Page ? <Page token={token} user={account} onExpired={expire} /> : null
  }
  return (
    <>
    <Layout
      home={home}
      current={current}
      visiblePages={visiblePages}
      displayName={displayName}
      logoutError={logoutError}
      loggingOut={loggingOut}
      refreshing={refreshing}
      onRefresh={() => void refreshAuthorization(credential.token)}
      onLogout={() => setLogoutConfirmOpen(true)}
      onRelogin={() => void logout(credential.token)}
      renderPage={renderPage}
    />
    <Modal
      title={t('signOut')}
      open={logoutConfirmOpen}
      centered
      mask={{ closable: false }}
      okText={t('signOut')}
      cancelText={t('cancel')}
      onCancel={() => setLogoutConfirmOpen(false)}
      onOk={() => {
        setLogoutConfirmOpen(false)
        void logout(credential.token)
      }}
    >
      <p>{t('signOutConfirm')}</p>
    </Modal>
    </>
  )
}
