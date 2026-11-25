import ManagementPage from '../../../components/ManagementPage'
import type { ManagementConfig, PageProps } from '../../../components/ManagementPage'

const config: ManagementConfig = {
  "title": "departmentManagement",
  "subtitle": "aClearHierarchyForOrganizedTeamwork",
  "tableTitle": "organizationStructure",
  "add": "addDepartment",
  "endpoint": "/system/departments",
  "permission": "department",
  "paged": false,
  "filters": true,
  "fields": [
    {
      "name": "parentId",
      "label": "parentDepartment",
      "kind": "number"
    },
    {
      "name": "name",
      "label": "departmentName",
      "required": true
    },
    {
      "name": "code",
      "label": "departmentCode"
    },
    {
      "name": "leader",
      "label": "departmentLead"
    },
    {
      "name": "phone",
      "label": "phone"
    },
    {
      "name": "email",
      "label": "email"
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
      "label": "departmentName"
    },
    {
      "name": "code",
      "label": "departmentCode"
    },
    {
      "name": "leader",
      "label": "departmentLead"
    },
    {
      "name": "phone",
      "label": "phone"
    },
    {
      "name": "userCount",
      "label": "directUsers"
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

export default function DepartmentPage(props: PageProps) {
  return <ManagementPage {...props} config={config} />
}
