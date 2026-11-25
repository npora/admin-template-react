import { i18nConfig } from '../../config/i18n'
import { GlobalOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const en = i18n.resolvedLanguage === 'en-US'

  if (!i18nConfig.enabled) return null

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectable: true,
        selectedKeys: [i18n.resolvedLanguage ?? 'zh-CN'],
        items: [
          { key: 'zh-CN', label: '简体中文' },
          { key: 'en-US', label: 'English' }
        ],
        onClick: ({ key }) => void i18n.changeLanguage(key)
      }}
    >
      <Button type={compact ? 'text' : 'default'} shape={compact ? 'circle' : 'default'} icon={<GlobalOutlined />} aria-label={en ? 'Language' : '语言'}>
        {!compact && (en ? 'English' : '简体中文')}
      </Button>
    </Dropdown>
  )
}
