import type { MenuNode } from '../router/menu'

export interface Session {
  user: {
    id: number
    username: string
    displayName: string
    avatar?: string
    roles?: string[]
    isSuperAdmin: boolean
    permissions: string[]
  }
  routes: MenuNode[]
}
