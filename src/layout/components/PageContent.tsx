import { Component, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { finishStartup, isStarting } from '../../startup'
import wave from '../../startup/wave.html?raw'

const navigationDelay = 120

function LoadingPage({ onBusy }: { onBusy: (value: boolean) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isStarting()) onBusy(true)
    }, navigationDelay)
    return () => {
      window.clearTimeout(timer)
      onBusy(false)
    }
  }, [onBusy])

  return null
}

function PageReady({ children }: { children: ReactNode }) {
  useEffect(finishStartup, [])
  return children
}

class PageErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function PageContent({ children, transition }: {
  children: ReactNode
  transition: 'none' | 'fade' | 'slide'
}) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)

  return (
    <main className="content" aria-busy={pending}>
      {pending && <div className="app-navigation-progress" aria-hidden="true" />}
      {pending && <div className="workspace__loading" role="status" aria-live="polite">
        <div>
          <div dangerouslySetInnerHTML={{ __html: wave }} />
          <p>{t('pageLoading')}</p>
        </div>
      </div>}
      <div className={`workspace__page workspace__page--${transition}`} inert={pending}>
        <PageErrorBoundary fallback={<PageReady>
          <section className="panel" role="alert">
            <p>{t('pageLoadFailed')}</p>
            <Button onClick={() => window.location.reload()}>{t('tryAgain')}</Button>
          </section>
        </PageReady>}>
          <Suspense fallback={<LoadingPage onBusy={setPending} />}>
            <PageReady>{children}</PageReady>
          </Suspense>
        </PageErrorBoundary>
      </div>
    </main>
  )
}
