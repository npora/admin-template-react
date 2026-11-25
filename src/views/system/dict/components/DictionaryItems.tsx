import { useState } from 'react'
import { Drawer } from 'antd'
import { useTranslation } from 'react-i18next'
import ManagementPage from '../../../../components/ManagementPage'
import type { ManagementConfig, ManagementRow, PageProps } from '../../../../components/ManagementPage'

export default function DictionaryItems({ dictionary, onClose, onChanged, ...props }: PageProps & {
  dictionary: ManagementRow
  onClose: () => void
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [config] = useStateConfig(dictionary.id)
  return <Drawer open title={`${t('dict:items')} · ${String(dictionary.name ?? '')}`} size={820} onClose={onClose}>
    <ManagementPage {...props} config={config} onChanged={onChanged} />
  </Drawer>
}

function useStateConfig(id: number) {
  return useState<ManagementConfig>(() => ({
    title: 'dict:items', subtitle: 'dict:description', tableTitle: 'dict:items', add: 'dict:addItem',
    endpoint: `/system/dict-types/${id}/items`, permission: 'dict-item', paged: true, filters: true,
    fields: [
      { name: 'label', label: 'dict:label', required: true },
      { name: 'value', label: 'dict:value', required: true },
      { name: 'tagType', label: 'dict:tagType', kind: 'select', initial: 'info',
        options: ['primary','success','warning','danger','info'].map(value => ({ value, label: 'dict:color_'+value })) },
      { name: 'remark', label: 'dict:remark' },
      { name: 'sortOrder', label: 'sortOrder', kind: 'number', initial: 0 },
      { name: 'status', label: 'status', kind: 'select', initial: 1 }
    ],
    columns: [
      { name: 'label', label: 'dict:label' }, { name: 'value', label: 'dict:value' },
      { name: 'tagType', label: 'dict:tagType' }, { name: 'sortOrder', label: 'sortOrder' }, { name: 'status', label: 'status' }
    ]
  }))
}
