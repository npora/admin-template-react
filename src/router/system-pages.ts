import { lazy } from 'react'

const UserList = lazy(() => import('../views/system/user'))
const AuditLog = lazy(() => import('../views/system/audit-log'))

const Department = lazy(() => import('../views/system/department'))

const Role = lazy(() => import('../views/system/role'))

const Menu = lazy(() => import('../views/system/menu'))

const Dict = lazy(() => import('../views/system/dict'))

export const systemPages = {
  'system/dict/index': { page: Dict, path: '/system/dict', permission: 'system:dict:list' },
  'system/menu/index': { page: Menu, path: '/system/menu', permission: 'system:menu:list' },
  'system/role/index': { page: Role, path: '/system/role', permission: 'system:role:list' },
  'system/department/index': { page: Department, path: '/system/department', permission: 'system:department:list' },
  'system/user/index': { page: UserList, path: '/system/user', permission: 'system:user:list' },
  'system/audit-log/index': { page: AuditLog, path: '/system/audit-log', permission: 'system:audit-log:list' }
} as const

export function getSystemPage(component: string) {
  if (Object.hasOwn(systemPages, component)) return systemPages[component as keyof typeof systemPages]
  return undefined
}

export const dynamicViewPaths = [
  'dashboard/index', 'profile/index', ...Object.keys(systemPages)
]
