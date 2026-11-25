import { request } from '../client'

export interface RoleOption {
  id: number
  name: string
  status: number
}

export interface DepartmentOption {
  id: number
  name: string
  status: number
  children?: DepartmentOption[]
}

export interface UserFields {
  displayName: string
  departmentId: number | null
  avatar: string | null
  email: string | null
  mobile: string | null
  status: 0 | 1
  roleIds: number[]
}

export interface ManagedUser extends UserFields {
  id: number
  username: string
  departmentName: string | null
  roles: RoleOption[]
  isSuperAdmin: boolean
  authenticatorEnabled: boolean
  createdAt: number
}

export interface UserFilters {
  keyword?: string
  departmentId?: number
  roleId?: number
  status?: 0 | 1
}

export const userApi = {
  list: (token: string, query: UserFilters & { page: number; pageSize: number }, signal: AbortSignal) =>
    request<{ list: ManagedUser[]; total: number }>('/system/users', { token, query: { ...query }, signal }),
  departments: (token: string, signal: AbortSignal) =>
    request<DepartmentOption[]>('/system/departments/options', { token, signal }),
  roles: (token: string, signal: AbortSignal) =>
    request<RoleOption[]>('/system/roles/options', { token, signal }),
  create: (token: string, json: UserFields & { username: string; password: string }, signal: AbortSignal) =>
    request<ManagedUser>('/system/users', { token, json, signal }),
  update: (token: string, id: number, json: UserFields, signal: AbortSignal) =>
    request<ManagedUser>(`/system/users/${id}`, { token, json, method: 'PUT', signal }),
  remove: (token: string, id: number, signal: AbortSignal) =>
    request<null>(`/system/users/${id}`, { token, method: 'DELETE', signal })
}
