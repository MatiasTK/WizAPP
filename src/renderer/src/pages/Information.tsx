import BulbDot from '@components/BulbDot'
import BulbFacts, { SignalBars } from '@components/BulbFacts'
import Page from '@components/Page'
import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import Spinner from '@components/ui/Spinner'
import { useBulbStore } from '@renderer/context/BulbStore'
import { cn } from '@renderer/lib/cn'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuRefreshCw } from 'react-icons/lu'

export default function Information() {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const probeAll = useBulbStore((s) => s.probeAll)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await probeAll()
    setRefreshing(false)
  }

  return (
    <Page
      title={t('information.title')}
      subtitle={t('information.subtitle')}
      actions={
        <Button disabled={refreshing || bulbs.length === 0} onClick={() => void handleRefresh()}>
          {refreshing ? <Spinner /> : <LuRefreshCw size={15} strokeWidth={2.2} aria-hidden />}
          {t('information.refresh')}
        </Button>
      }
    >
      {bulbs.length === 0 ? (
        <EmptyState title={t('information.missingTitle')} description={t('information.missing')} />
      ) : (
        <section
          aria-label={t('information.caption')}
          className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3.5"
        >
          {bulbs.map((bulb) => (
            <article
              key={bulb.ip}
              aria-labelledby={`info-${bulb.ip}`}
              className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface px-5 py-[18px]"
            >
              <div className="flex items-center gap-3">
                <BulbDot bulb={bulb} size={32} />
                <div className="min-w-0 grow">
                  <h2 id={`info-${bulb.ip}`} className="truncate text-base font-bold">
                    {bulb.name}
                  </h2>
                  <span
                    className={cn('text-[13px]', bulb.online ? 'text-muted' : 'text-danger-text')}
                  >
                    {!bulb.online
                      ? t('information.offlineStatus')
                      : bulb.state
                        ? t('bulb.on')
                        : t('bulb.off')}
                  </span>
                </div>
                <SignalBars rssi={bulb.rssi} />
              </div>
              <BulbFacts bulb={bulb} copyable />
            </article>
          ))}
        </section>
      )}
    </Page>
  )
}
