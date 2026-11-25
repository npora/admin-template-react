import { request } from '../client'
import type { ManagedUser } from './user'

export interface DashboardOverview {
  generatedAt: number
  account: { roleNames: string[]; departmentName: string | null; isSuperAdmin: boolean }
  capabilities: { users: boolean; roles: boolean; departments: boolean; menus: boolean }
  accessiblePages: number
  users?: {
    total: number
    enabled: number
    disabled: number
    recent: ManagedUser[]
    departments: { id: number | null; name: string; count: number }[]
  }
  roles?: { total: number; enabled: number }
  departments?: { total: number; enabled: number }
}

export function getOverview(token: string, signal: AbortSignal) {
  return request<DashboardOverview>('/system/dashboard', { token, signal })
}
