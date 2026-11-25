import { Button, Drawer, Segmented, Select, Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import { i18nConfig } from '../../config/i18n'
import { accents, defaults, usePreferences } from '../../settings/preferences'
import type { Preferences } from '../../settings/preferences'
import { TIME_ZONE } from '../../settings/timezone'

export default function AppSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { update } = usePreferences()
  const { i18n } = useTranslation()
  return <Drawer open={open} onClose={onClose} title={t('appSettings')} size={390}
    footer={<Button onClick={() => { update(defaults); if(i18nConfig.enabled) void i18n.changeLanguage(i18nConfig.defaultLocale) }}>{t('restoreDefaults')}</Button>}>
    <SettingsFields />
  </Drawer>
}

export function SettingsFields() {
  const { t, i18n } = useTranslation()
  const { preferences, update } = usePreferences()

  function choice<K extends keyof Preferences>(key: K, label: string, options: {value: Preferences[K]; label: string}[]) {
    return <label>{t(label)}<Select aria-label={t(label)} value={preferences[key]} virtual={false} options={options}
      onChange={(value) => update({ [key]: value })} /></label>
  }
  function segment<K extends 'mode' | 'size'>(key: K, label: string, options: {value: Preferences[K]; label: string}[]) {
    return <div className="app-settings__field"><span>{t(label)}</span>
      <Segmented block aria-label={t(label)} value={preferences[key]} options={options}
        onChange={(value) => update({ [key]: value })} /></div>
  }
  function preview<K extends 'layout' | 'tabStyle'>(key: K, label: string, options: {value: Preferences[K]; label: string}[]) {
    return <div className="app-settings__field"><span>{t(label)}</span>
      <div className="app-settings__previews" role="group" aria-label={t(label)}>
        {options.map(({value,label}) => <button key={value} type="button" aria-pressed={preferences[key] === value}
          onClick={() => update({[key]:value})}>
          <span className={`app-settings__preview app-settings__preview--${value}`} aria-hidden="true"><i /><b /><em /></span>
          {label}
        </button>)}
      </div></div>
  }
  function toggle(key: 'grayscale' | 'colorVision' | 'logo' | 'breadcrumbs' | 'tabs' | 'watermark', label: string) {
    return <label className="app-settings__switch">{t(label)}<Switch aria-label={t(label)}
      checked={preferences[key]} onChange={(value) => update({ [key]: value })} /></label>
  }
  return (
    <div className="app-settings">
      {i18nConfig.enabled && <label>{t('language:current')}<Select aria-label={t('language:current')} value={i18n.resolvedLanguage}
        options={[{value:'zh-CN',label:'简体中文'},{value:'en-US',label:'English'}]} onChange={(value)=>void i18n.changeLanguage(value)} /></label>}
      {choice('timeZone','timezone:title',Object.entries(TIME_ZONE).map(([zone,value])=>({value,label:`${t('timezone:'+zone)} · ${value}`})))}
      <small>{t('timezone:hint')}</small>
      <h2>{t('appearance')}</h2>
      {segment('mode','themeMode',(['light','dark','system'] as const).map(value=>({value,label:t(value)})))}
      <div className="app-settings__field"><span>{t('themeAccent')}</span>
        <div className="app-settings__swatches" role="group" aria-label={t('themeAccent')}>
          {(Object.entries(accents) as [keyof typeof accents,string][]).map(([value,color]) => {
            const label = t('themeAccent'+value[0].toUpperCase()+value.slice(1))
            return <button key={value} type="button" title={label} aria-label={label}
              aria-pressed={preferences.accent===value} style={{background:color}} onClick={() => update({accent:value})}>
              {preferences.accent===value && '✓'}
            </button>
          })}
        </div>
      </div>
      {segment('size','componentSize',(['large','default','small'] as const).map(value=>({value,label:t(value)})))}
      {toggle('grayscale','grayscaleMode')}
      {toggle('colorVision','colorVisionMode')}
      <h2>{t('layout')}</h2>
      {preview('layout','menuLayout',[{value:'sidebar',label:t('menuLayoutSidebar')},{value:'top',label:t('menuLayoutTop')},{value:'mixed',label:t('menuLayoutMixed')}])}
      {preview('tabStyle','tabStyle',[{value:'pill',label:t('tabStylePill')},{value:'underline',label:t('tabStyleUnderline')},{value:'card',label:t('tabStyleCard')}])}
      {choice('transition','pageTransition',[{value:'fade',label:t('pageTransitionFade')},{value:'slide',label:t('pageTransitionSlide')},{value:'none',label:t('pageTransitionNone')}])}
      {toggle('logo','showLogo')}
      {toggle('breadcrumbs','showBreadcrumbs')}
      {toggle('tabs','showTabs')}
      {toggle('watermark','fullscreenWatermark')}
    </div>
  )
}
