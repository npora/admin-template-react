import { getMenuIcon } from '../icons/menu'
import {
  CloseOutlined, MoreOutlined, ApartmentOutlined, AuditOutlined, BookOutlined, DownOutlined, EditOutlined, FileTextOutlined,
  FolderOpenOutlined, FullscreenExitOutlined, FullscreenOutlined, HomeOutlined, LockOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, MoonOutlined, SearchOutlined, SettingOutlined, SunOutlined,
  UserOutlined
} from '@ant-design/icons'
import { AutoComplete, Avatar, Breadcrumb, Button, Dropdown, Input, Modal, Tag, Watermark } from 'antd'
import { Activity, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { appTitle, demoEnabled } from '../config/app'
import Brand from '../components/Brand'
import LanguageSwitch from '../components/LanguageSwitch'
import { menuAddress } from '../router/menu'
import type { MenuPage } from '../router/menu'
import { usePreferences } from '../settings/preferences'
import PageContent from './components/PageContent'
import AppSettings from './components/AppSettings'
import ScreenLock from './components/ScreenLock'
import { readScreenLock } from './screen-lock'

interface LayoutProps {
  home: boolean
  current?: MenuPage
  visiblePages: MenuPage[]
  displayName: string
  logoutError: boolean
  loggingOut: boolean
  onLogout: () => void
  onRelogin: () => void
  refreshing: boolean
  onRefresh: () => void
  renderPage: (path: string) => ReactNode
}

const icons = {
  'system/user/index': UserOutlined,
  'system/department/index': ApartmentOutlined,
  'system/role/index': LockOutlined,
  'system/menu/index': SettingOutlined,
  'system/dict/index': BookOutlined,
  'system/audit-log/index': AuditOutlined,
  'examples/form/index': EditOutlined
}

export default function Layout({
  home, current, visiblePages, displayName, logoutError, loggingOut, onLogout, onRelogin, refreshing, onRefresh, renderPage
}: LayoutProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { preferences, update, dark } = usePreferences()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 767px)').matches)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullscreenError, setFullscreenError] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [locked, setLocked] = useState(() => Boolean(readScreenLock()))
  const [closedGroups, setClosedGroups] = useState<string[]>([])
  const path = location.pathname
  const address = path + location.search + location.hash
  const [trackedAddress, setTrackedAddress] = useState('')
  const [visited, setVisited] = useState<Record<string, string>>({})
  const [versions, setVersions] = useState<Record<string, number>>({})
  if (trackedAddress !== address) {
    setTrackedAddress(address)
    setVisited(previous => ({ ...previous, [path]: address }))
  }
  const mode = mobile ? 'sidebar' : preferences.layout

  useEffect(() => {
    const viewport = matchMedia('(max-width: 767px)')
    const resize = () => setMobile(viewport.matches)
    const change = () => setFullscreen(Boolean(document.fullscreenElement))
    viewport.addEventListener('change', resize)
    document.addEventListener('fullscreenchange', change)
    return () => {
      viewport.removeEventListener('change', resize)
      document.removeEventListener('fullscreenchange', change)
    }
  }, [])

  const menuGroups = new Map<string, MenuPage[]>()
  for (const page of [...visiblePages].sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity))) {
    const section = page.section ?? ''
    const group = menuGroups.get(section) ?? []
    group.push(page)
    menuGroups.set(section, group)
  }
  const entries = [...menuGroups].flatMap(([name, pages]) => name ? [{ name, pages }] :
    pages.map((page) => ({ name: '', pages: [page] })))
  const formIndex = entries.findIndex(({ pages, name }) => !name && pages[0].component === 'examples/form/index')
  const examplesIndex = entries.findIndex(({ pages, name }) => name && pages[0].component.startsWith('examples/'))
  if (formIndex > examplesIndex && examplesIndex >= 0) entries.splice(examplesIndex, 0, ...entries.splice(formIndex, 1))
  const activeGroup = entries.find(({ pages }) => pages.some((page) => page.path === current?.path))
  const showSidebar = mode === 'sidebar' || (mode === 'mixed' && Boolean(activeGroup?.name))
  const desktopCollapsed = !mobile && sidebarCollapsed

  function pageLink(page: MenuPage) {
    const Icon = getMenuIcon(page.icon) ?? icons[page.component as keyof typeof icons] ?? FileTextOutlined
    return <Link key={page.path} to={menuAddress(page)} title={page.title}
      onClick={() => setMobileOpen(false)} aria-current={(current?.activeMenu ?? current?.path) === page.path ? 'page' : undefined}>
      <Icon /><span>{page.title}</span>
    </Link>
  }
  async function toggleFullscreen() {
    setFullscreenError(false)
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { setFullscreenError(true) }
  }
  function closeSearch() { setMenuSearch(''); setSearchOpen(false) }
  const normalizedTerms = menuSearch.normalize('NFKC').trim().toLowerCase().split(/\s+/).filter(Boolean)
  const searchOptions = [
    { path: '/dashboard', title: t('routes:Dashboard'), component: 'dashboard/index', hidden: false, name: 'Dashboard' },
    ...visiblePages
  ].filter((page) => {
    const source = page.name ? i18n.getFixedT('zh-CN', 'routes')(page.name) : ''
    const english = page.name ? i18n.getFixedT('en-US', 'routes')(page.name) : ''
    const known = page.title === source || page.title === english
    const searchable = [page.title, page.path, page.section, ...(known ? [source, english] : [])]
      .filter(Boolean).join(' ').normalize('NFKC').toLowerCase()
    return normalizedTerms.every((term) => searchable.includes(term))
  }).slice(0,12).map((page) => ({ value: menuAddress(page), label: page.title }))
  const homeLink = <Link to="/dashboard" title={t('routes:Dashboard')} aria-current={home ? 'page' : undefined}
    onClick={() => setMobileOpen(false)}><HomeOutlined /><span>{t('routes:Dashboard')}</span></Link>

  const opened = Object.entries(visited)
  const tabs = visiblePages.filter(page => page.fixedTab || page.path in visited)
    .sort((a,b) => Number(Boolean(b.fixedTab)) - Number(Boolean(a.fixedTab)) ||
      opened.findIndex(([key])=>key===a.path) - opened.findIndex(([key])=>key===b.path))
  const closable = (target: string) => target !== '/dashboard' && !tabs.find(item=>item.path===target)?.fixedTab
  function closeTabs(targets: string[]) {
    setVisited(previous=>Object.fromEntries(Object.entries(previous).filter(([key])=>!targets.includes(key))))
    setVersions(previous=>Object.fromEntries(Object.entries(previous).filter(([key])=>!targets.includes(key))))
    if(targets.includes(path)) navigate(tabs.filter(page=>!targets.includes(page.path) && page.path!==path)
      .map(page=>visited[page.path] ?? menuAddress(page)).at(-1) ?? '/dashboard', { replace:true })
  }
  const retained = visiblePages.filter(page=>page.path !== path && page.path in visited &&
    (page.keepAlive ?? page.component === 'examples/cache/index')).map(page=>page.path)

  return (
    <div className={`shell shell--${mode}${showSidebar ? ' shell--with-sidebar' : ''}${desktopCollapsed ? ' shell--collapsed' : ''}${mobileOpen ? ' shell--mobile-open' : ''}`}>
      {showSidebar && <aside className="shell__sidebar">
        {preferences.logo && <Brand />}
        <nav aria-label={t('routes:System')}>
          {mode === 'sidebar' && homeLink}
          {(mode === 'mixed' ? (activeGroup ? [activeGroup] : []) : entries).map(({ name, pages }) => {
            if (!name) return pageLink(pages[0])
            const open = !closedGroups.includes(name)
            const GroupIcon = pages.some(page => page.component.startsWith('system/')) ? SettingOutlined : FolderOpenOutlined
            if (desktopCollapsed) return <Dropdown key={name} trigger={['click','hover']} placement="bottomLeft" menu={{
              selectedKeys: current ? [current.path] : [], items: pages.map(page => ({key:menuAddress(page),label:page.title})),
              onClick: ({key}) => navigate(key)
            }}><button className="shell__menu-title" type="button" aria-label={name} title={name}><GroupIcon /></button></Dropdown>
            return <div className="shell__menu-group" key={name}>
              <button className="shell__menu-title" type="button" aria-expanded={open}
                onClick={() => setClosedGroups(open ? closedGroups.filter(n => n !== name).concat(name) : closedGroups.filter(n => n !== name))}>
                <GroupIcon /><span>{name}</span><DownOutlined className={open ? 'shell__menu-arrow is-open' : 'shell__menu-arrow'} />
              </button>
              {open && <div className="shell__submenu">{pages.map(pageLink)}</div>}
            </div>
          })}
        </nav>
      </aside>}
      {mobile && mobileOpen && <button className="shell__mask" type="button" aria-label={t('closeMenu')} onClick={() => setMobileOpen(false)} />}
      <div className="workspace">
        <header>
          <div className="workspace__location">
            {showSidebar && <Button type="text" shape="circle" icon={desktopCollapsed || (mobile && !mobileOpen) ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              aria-label={t(mobile ? mobileOpen ? 'closeMenu' : 'openMenu' : desktopCollapsed ? 'expandSidebar' : 'collapseSidebar')}
              aria-expanded={mobile ? mobileOpen : !desktopCollapsed}
              onClick={() => mobile ? setMobileOpen(!mobileOpen) : setSidebarCollapsed(!sidebarCollapsed)} />}
            {mode !== 'sidebar' ? <nav className="workspace__top-nav" aria-label={t('menuLayout')}>
              {preferences.logo && <Brand />}{homeLink}
              {entries.map(({name,pages}) => name ? (
                <Dropdown key={name} menu={{ items: pages.map(page => ({key:menuAddress(page),label:page.title})), onClick:({key})=>navigate(key) }}>
                  <Button type="text" onClick={() => mode === 'mixed' && navigate(menuAddress(pages[0]))}>{name}<DownOutlined /></Button>
                </Dropdown>
              ) : pageLink(pages[0]))}
            </nav> : preferences.breadcrumbs && !mobile && <Breadcrumb items={home ? [{title:t('routes:Dashboard')}] : [
              ...(current?.section ? current.section.split(' / ').map(title => ({title})) : []),
              {title:current?.title ?? (location.pathname === '/profile' ? t('profile:title') : t('routes:Dashboard'))}
            ]} />}
          </div>
          <div className="workspace__actions">
            <Button type="text" shape="circle" icon={<SearchOutlined />} aria-label={t('menuSearch')} onClick={() => setSearchOpen(true)} />
            <LanguageSwitch compact />
            {demoEnabled && !mobile && <Tag className="workspace__demo">{t('demoWorkspace')}</Tag>}
            <Button type="text" shape="circle" icon={dark ? <SunOutlined /> : <MoonOutlined />}
              aria-label={t(dark ? 'switchToLightMode' : 'switchToDarkMode')} onClick={() => update({mode:dark?'light':'dark'})} />
            {document.fullscreenEnabled && <Button type="text" shape="circle" icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              aria-label={t(fullscreen ? 'exitFullscreen' : 'enterFullscreen')} onClick={() => void toggleFullscreen()} />}
            <Button type="text" shape="circle" icon={<LockOutlined />} aria-label={t('lockScreen')} onClick={() => setLockOpen(true)} />
            <span className="workspace__separator" />
            <Dropdown placement="bottom" arrow trigger={['click']} menu={{ items: [
              {key:'profile',label:t('profile:title')}, {key:'refresh',label:t(refreshing?'refreshingPermissions':'refreshPermissions'),disabled:refreshing},
              {key:'clear',label:t('clearCache')}, {key:'logout',label:t('signOut'),disabled:loggingOut}
            ], onClick: ({key}) => {
              if (key === 'profile') navigate('/profile')
              if (key === 'refresh') onRefresh()
              if (key === 'clear' && window.confirm(t('clearCacheConfirm'))) window.location.reload()
              if (key === 'logout') onLogout()
            } }}>
              <button type="button" className="workspace__account" aria-label={t('userMenu')}>
                <Avatar shape="square" size={30} icon={<UserOutlined />} />
                {!mobile && <><span>{displayName}</span><DownOutlined /></>}
              </button>
            </Dropdown>
            <Button type="text" shape="circle" icon={<SettingOutlined />} aria-label={t('appSettings')} onClick={() => setSettingsOpen(true)} />
          </div>
        </header>
        {preferences.tabs && !mobile && <nav className={`workspace__tabs workspace__tabs--${preferences.tabStyle}`} aria-label={t('showTabs')}>
          <Link to="/dashboard" aria-current={home ? 'page' : undefined}>{t('routes:Dashboard')}</Link>
          {tabs.map(page=><span className="workspace__tab" key={page.path}>
            <Link to={visited[page.path] ?? menuAddress(page)} aria-current={page.path === path ? 'page' : undefined}>{page.title}</Link>
            {closable(page.path)&&<button type="button" aria-label={t('closeTab',{value:page.title})}
              onClick={()=>closeTabs([page.path])}><CloseOutlined /></button>}
          </span>)}
          <Dropdown trigger={['click']} menu={{items:[
            {key:'refresh',label:t('refreshTab')},{key:'current',label:t('closeCurrentTab'),disabled:!closable(path)},
            {key:'others',label:t('closeOtherTabs')},{key:'all',label:t('closeAllTabs')}
          ],onClick:({key})=>{
            if(key==='refresh')setVersions(previous=>({...previous,[path]:(previous[path]??0)+1}))
            if(key==='current'&&closable(path))closeTabs([path])
            if(key==='others'||key==='all')closeTabs(Object.keys(visited).filter(target=>closable(target)&&(key==='all'||target!==path)))
          }}}><Button type="text" className="workspace__tabs-menu" aria-label={t('moreActions')} icon={<MoreOutlined />} /></Dropdown>
        </nav>}
        {[path,...retained].map(pagePath=><Activity key={pagePath} mode={pagePath === path ? 'visible' : 'hidden'}>
          <PageContent key={versions[pagePath] ?? 0} transition={preferences.transition}>
            {pagePath === path && logoutError && <p role="alert">退出登录失败，请重试。</p>}
            {pagePath === path && fullscreenError && <p role="alert">{t('yourBrowserDidNotAllowFullscreen')}</p>}
            {renderPage(pagePath)}
          </PageContent>
        </Activity>)}
      </div>
      {preferences.watermark && <Watermark content={appTitle} className="workspace__watermark" />}
      <Modal title={t('menuSearch')} open={searchOpen} onCancel={closeSearch} footer={null} afterOpenChange={open => {
        if (open) document.getElementById('workspace-menu-search')?.focus()
      }}>
        <AutoComplete id="workspace-menu-search" style={{width:'100%'}} value={menuSearch}
          options={searchOptions}
          onChange={setMenuSearch} onSelect={path => { closeSearch(); navigate(path) }}>
          <Input aria-label={t('menuSearch')} placeholder={t('menuSearchPlaceholder')} prefix={<SearchOutlined />} />
        </AutoComplete>
      </Modal>
      <AppSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ScreenLock open={lockOpen} locked={locked} onClose={() => setLockOpen(false)} onLock={setLocked} onLogout={onRelogin} loggingOut={loggingOut} logoutError={logoutError} />
    </div>
  )
}
