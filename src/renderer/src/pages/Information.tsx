import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import IconButton from '@components/ui/IconButton'
import Spinner from '@components/ui/Spinner'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { cn } from '@renderer/lib/cn'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCopy, LuInfo, LuRefreshCw } from 'react-icons/lu'

const NONE = '—'

export default function Information() {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const probeAll = useBulbStore((s) => s.probeAll)
  const pushToast = useBulbStore((s) => s.pushToast)
  const { byId } = useCatalog()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await probeAll()
    setRefreshing(false)
  }

  const handleCopy = async (value: string, kind: 'ip' | 'mac') => {
    try {
      await navigator.clipboard.writeText(value)
      pushToast(kind === 'ip' ? 'information.copiedIp' : 'information.copiedMac', 'success')
    } catch {
      pushToast('information.copyFailed', 'error')
    }
  }

  const copyCell = (value: string, kind: 'ip' | 'mac', name: string) => {
    if (!value) return NONE
    return (
      <span className="flex items-center gap-1">
        <span className="tabular-nums">{value}</span>
        <IconButton
          label={t(kind === 'ip' ? 'information.copyIp' : 'information.copyMac', { name })}
          onClick={() => void handleCopy(value, kind)}
          className="size-6"
        >
          <LuCopy size={14} aria-hidden />
        </IconButton>
      </span>
    )
  }

  const headers = [
    'name',
    'status',
    'addresses',
    'modelFirmware',
    'signal',
    'brightness',
    'scene'
  ] as const

  return (
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('information.title')}</h1>
          <p className="mt-1 text-base text-muted">{t('information.subtitle')}</p>
        </div>
        <Button disabled={refreshing || bulbs.length === 0} onClick={() => void handleRefresh()}>
          {refreshing ? <Spinner /> : <LuRefreshCw size={16} aria-hidden />}
          {t('information.refresh')}
        </Button>
      </header>

      {bulbs.length === 0 ? (
        <EmptyState
          icon={<LuInfo size={28} aria-hidden />}
          title={t('information.missingTitle')}
          description={t('information.missing')}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t('information.caption')}</caption>
            <thead className="bg-sunken text-xs text-muted">
              <tr>
                {headers.map((h) => (
                  <th key={h} scope="col" className="px-3 py-3 font-medium">
                    {t(`information.columns.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bulbs.map((bulb) => {
                const scene = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
                return (
                  <tr
                    key={bulb.ip}
                    aria-current={bulb.ip === activeBulb?.ip ? 'true' : undefined}
                    className={cn(
                      'border-b border-border last:border-b-0',
                      bulb.ip === activeBulb?.ip && 'bg-raised'
                    )}
                  >
                    <th scope="row" className="px-3 py-3 font-medium">
                      {bulb.name}
                    </th>
                    <td className="px-3 py-3">
                      {bulb.online ? (
                        <>
                          {t('bulb.connected')}
                          <span className="block text-xs text-muted">
                            {bulb.state ? t('bulb.on') : t('bulb.off')}
                          </span>
                        </>
                      ) : (
                        <span className="text-danger-text">
                          {t('bulb.offlineLabel')}
                          <span className="block text-xs text-muted">
                            {t('information.lastKnown')}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="sr-only">{t('information.columns.ip')}:</span>
                          {copyCell(bulb.ip, 'ip', bulb.name)}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted">
                          <span className="sr-only">{t('information.columns.mac')}:</span>
                          {copyCell(bulb.mac, 'mac', bulb.name)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {bulb.moduleName || NONE}
                      <span className="block text-xs text-muted">
                        <span className="sr-only">{t('information.columns.firmware')}: </span>
                        {bulb.fwVersion || NONE}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{bulb.rssi !== 0 ? bulb.rssi : NONE}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {bulb.dimming != null ? `${bulb.dimming}%` : NONE}
                    </td>
                    <td className="px-3 py-3">{scene?.name ?? NONE}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
