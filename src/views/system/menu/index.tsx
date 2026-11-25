import { Select, Space, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { menuIcons } from '../../../icons/menu'
import { dynamicViewPaths } from '../../../router/system-pages'
import type { ManagementRow } from '../../../components/ManagementPage'
import ManagementPage from '../../../components/ManagementPage'
import type { ManagementConfig, PageProps } from '../../../components/ManagementPage'

const config: ManagementConfig = {
  "title": "menusAndButtonPermissions",
  "subtitle": "clearNavigationWithExplicitAccessForEveryAction",
  "tableTitle": "nodeTree",
  "add": "addNode",
  "endpoint": "/system/menus",
  "permission": "menu",
  "paged": false,
  "filters": false,
  "fields": [
    {
      "name": "type",
      "label": "type",
      "kind": "select",
      "options": [{ "value": 1, "label": "directory" }, { "value": 2, "label": "page" }, { "value": 3, "label": "permissionCode" }],
      "initial": 1
    },
    {
      "name": "parentId",
      "label": "parentNode",
      "kind": "number"
    },
    {
      "name": "title",
      "label": "name",
      "required": true
    },
    {
      "name": "name",
      "label": "routeName"
    },
    {
      "name": "path",
      "label": "path"
    },
    {
      "name": "component",
      "label": "component"
    },
    {
      "name": "redirect",
      "label": "redirect"
    },
    { "name": "routeQuery", "label": "defaultQueryJSON", "json": true },
    {
      "name": "activeMenu",
      "label": "menuActivePath"
    },
    {
      "name": "icon",
      "label": "menuIcon"
    },
    {
      "name": "permission",
      "label": "permissionCode"
    },
    {
      "name": "visible",
      "label": "menuVisible",
      "kind": "switch",
      "initial": true
    },
    {
      "name": "alwaysShow",
      "label": "menuAlwaysShow",
      "kind": "switch",
      "initial": false
    },
    {
      "name": "keepAlive",
      "label": "menuKeepAlive",
      "kind": "switch",
      "initial": false
    },
    {
      "name": "fixedTab",
      "label": "menuFixedTab",
      "kind": "switch",
      "initial": false
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
      "name": "title",
      "label": "name"
    },
    {
      "name": "type",
      "label": "type"
    },
    {
      "name": "path",
      "label": "path"
    },
    {
      "name": "component",
      "label": "component"
    },
    {
      "name": "permission",
      "label": "permissionCode"
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

function referenced(rows: ManagementRow[], component: string, currentId?: number): boolean {
  return rows.some(row => (row.id !== currentId && row.component === component) ||
    Boolean(row.children && referenced(row.children, component, currentId)))
}

export default function MenuPage(props: PageProps) {
  const { t } = useTranslation()
  return <ManagementPage {...props} config={config} renderField={(field, rows, editing) => {
    if (field.name === 'icon') return <Select allowClear showSearch
      options={Object.entries(menuIcons).map(([value,Icon])=>({value,label:value,preview:<Space><Icon />{value}</Space>}))}
      optionRender={(option)=>option.data.preview} optionFilterProp="label" />
    if (field.name === 'component') {
      const current = typeof editing?.component === 'string' ? editing.component : undefined
      const allowed = current && !dynamicViewPaths.includes(current) ? [current, ...dynamicViewPaths] : dynamicViewPaths
      return <Select allowClear showSearch optionFilterProp="label"
        options={allowed.map(value=>({ value, label:value, preview:<Space>
          {value}
          {value===current?<Tag>{t('pageComponentCurrent')}</Tag>:
            referenced(rows,value,editing?.id)?<Tag>{t('pageComponentInUse')}</Tag>:null}
        </Space> }))} optionRender={(option)=>option.data.preview} />
    }
    return undefined
  }} />
}
