import test from 'node:test'
import assert from 'node:assert/strict'
import { can } from '../src/auth/permissions.ts'
import { collectPages } from '../src/router/menu.ts'

test('preserves component identifiers, relative routes, and hidden-page access metadata', () => {
  const pages = collectPages([
    {
      path: '/system',
      title: '系统管理',
      children: [{ path: 'user', title: '用户管理', component: 'system/user/index', hidden: true }]
    },
    { path: '//other.test', title: 'External', component: 'system/user/index' }
  ])
  assert.deepEqual(pages, [
    {
      path: '/system/user',
      title: '用户管理',
      section: '系统管理',
      component: 'system/user/index',
      hidden: true
    }
  ])
})

test('requires an explicit permission or the independent super-admin marker', () => {
  const user = {
    id: 1,
    displayName: 'Tester',
    username: 'admin',
    isSuperAdmin: false,
    permissions: []
  }
  assert.equal(can(user, 'system:user:list'), false)
  assert.equal(can({ ...user, permissions: ['system:user:list'] }, 'system:user:list'), true)
  assert.equal(can({ ...user, isSuperAdmin: true }, 'system:user:list'), true)
})
