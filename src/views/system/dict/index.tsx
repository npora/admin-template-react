import { Button } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { can } from '../../../auth/permissions'
import DictionaryItems from './components/DictionaryItems'
import type { ManagementRow } from '../../../components/ManagementPage'
import ManagementPage from '../../../components/ManagementPage'
import type { ManagementConfig, PageProps } from '../../../components/ManagementPage'

const config: ManagementConfig = {
  "title": "routes:SystemDict",
  "subtitle": "dict:description",
  "tableTitle": "dict:typeList",
  "add": "dict:addType",
  "endpoint": "/system/dict-types",
  "permission": "dict",
  "paged": true,
  "filters": true,
  "fields": [
    {
      "name": "name",
      "label": "dict:name",
      "required": true
    },
    {
      "name": "code",
      "label": "dict:code",
      "required": true
    },
    {
      "name": "remark",
      "label": "dict:remark"
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
      "label": "dict:name"
    },
    {
      "name": "code",
      "label": "dict:code"
    },
    {
      "name": "remark",
      "label": "dict:remark"
    },
    {
      "name": "itemCount",
      "label": "dict:itemCount"
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

export default function DictPage(props: PageProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<{ row: ManagementRow; reload: () => void }>()
  return <>
    <ManagementPage {...props} config={config} rowAction={can(props.user, 'system:dict-item:list')
      ? (row, reload) => <Button type="link" onClick={() => setSelected({ row, reload })}>{t('dict:items')}</Button>
      : undefined} />
    {selected && <DictionaryItems {...props} key={selected.row.id} dictionary={selected.row} onClose={() => setSelected(undefined)} onChanged={selected.reload} />}
  </>
}
