import { Button } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { can } from '../../../auth/permissions'
import RoleGrant from './components/RoleGrant'
import type { ManagementRow } from '../../../components/ManagementPage'
import ManagementPage from '../../../components/ManagementPage'
import type { ManagementConfig, PageProps } from '../../../components/ManagementPage'

const config: ManagementConfig = {
  "title": "roleManagement",
  "subtitle": "usersCanHaveMultipleRolesAssignAccessThroughMenusAndButtons",
  "tableTitle": "roleList",
  "add": "addRole",
  "endpoint": "/system/roles",
  "permission": "role",
  "paged": true,
  "filters": true,
  "fields": [
    {
      "name": "name",
      "label": "roleName",
      "required": true
    },
    {
      "name": "code",
      "label": "roleCode",
      "required": true
    },
    {
      "name": "description",
      "label": "description"
    },
    {
      "name": "sortOrder",
      "label": "sortOrder",
      "kind": "number",
      "initial": 0
    },
    {
      "name": "status",
      "label": "status",
      "kind": "select",
      "initial": 1
    }
  ],
  "columns": [
    {
      "name": "name",
      "label": "roleName"
    },
    {
      "name": "code",
      "label": "roleCode"
    },
    {
      "name": "description",
      "label": "description"
    },
    {
      "name": "userCount",
      "label": "linkedUsers"
    },
    {
      "name": "sortOrder",
      "label": "sortOrder"
    },
    {
      "name": "status",
      "label": "status"
    }
  ]
}

export default function RolePage(props: PageProps) {
  const { t } = useTranslation()
  const [role, setRole] = useState<ManagementRow>()
  return <>
    <ManagementPage {...props} config={config} rowAction={can(props.user, 'system:role:grant')
      ? (row) => <Button type="link" onClick={() => setRole(row)}>{t('permissions')}</Button>
      : undefined} />
    {role && <RoleGrant {...props} key={role.id} role={role} onClose={() => setRole(undefined)} />}
  </>
}
