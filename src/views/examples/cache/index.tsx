import { Card, Empty, Input } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function CacheExample() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  return <Card title={<h1>{t('pageCacheExample')}</h1>}>
    <Empty description={t('cacheExampleDescription')}>
      <Input style={{ width: 'min(320px, 100%)' }} value={text} placeholder={t('enterTextToTestCaching')} onChange={(event) => {
        setText(event.target.value)
      }} />
    </Empty>
  </Card>
}
