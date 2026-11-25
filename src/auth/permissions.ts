import type { Session } from './types'

export function can(user: Session['user'], permission: string) {
  return user.isSuperAdmin || user.permissions.includes(permission)
}
