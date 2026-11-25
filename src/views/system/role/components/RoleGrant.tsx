import { Alert, Button, Modal, Spin, Tree } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, request } from '../../../../api/client'
import type { ManagementRow, PageProps } from '../../../../components/ManagementPage'

interface MenuOption {
  id: number
  title: string
  status: number
  children?: MenuOption[]
}

function treeNodes(options: MenuOption[]): { key: number; title: string; children?: ReturnType<typeof treeNodes> }[] {
  return options.map(({ id, title, children }) => ({ key: id, title, children: children && treeNodes(children) }))
}

export default function RoleGrant({ token, role, onExpired, onClose }: PageProps & {
  role: ManagementRow
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<MenuOption[]>()
  const [checked, setChecked] = useState<number[]>([])
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const saveRequest = useRef<AbortController>(undefined)
  const endpoint = `/system/roles/${role.id}/menus`

  useEffect(() => () => saveRequest.current?.abort(), [token])
  useEffect(() => {
    const controller = new AbortController()
    const context = { token, signal: controller.signal }
    Promise.all([
      request<MenuOption[]>('/system/roles/menu-options', context),
      request<number[]>(endpoint, context)
    ]).then(([tree, selected]) => {
      if (controller.signal.aborted) return
      setOptions(tree)
      setChecked(selected)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else setError(t('couldNotLoadPermissionsSavingIsDisabledUntilLoadingSucceeds'))
    })
    return () => controller.abort()
  }, [endpoint, token, attempt, onExpired, t])

  async function save() {
    if (!options || saveRequest.current) return
    const controller = new AbortController()
    saveRequest.current = controller
    setSaving(true)
    setError('')
    try {
      await request(endpoint, { token, method: 'PUT', json: { menuIds: checked }, signal: controller.signal })
      if (!controller.signal.aborted) onClose()
    } catch (error) {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && (error.status === 401 || String(error.code) === '10002')) onExpired()
      else setError(error instanceof Error ? error.message : t('tryAgain'))
    } finally {
      saveRequest.current = undefined
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return <Modal open title={t('roleGrantTitle', { value: String(role.name ?? '') })}
    onCancel={() => { if (!saving) onClose() }} onOk={() => void save()}
    okText={t('savePermissions')} okButtonProps={{ disabled: !options }} confirmLoading={saving}>
    <Alert type="info" title={t('grantTreeHint')} />
    {error && <Alert type="error" title={error} action={!options && <Button onClick={() => {
      setError('')
      setAttempt((value) => value + 1)
    }}>{t('tryAgain')}</Button>} />}
    {options ? <Tree checkable checkStrictly defaultExpandAll treeData={treeNodes(options)} checkedKeys={checked}
      disabled={saving} onCheck={(keys) => setChecked((Array.isArray(keys) ? keys : keys.checked).map(Number))} />
      : !error && <Spin />}
  </Modal>
}
