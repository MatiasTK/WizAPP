import IconButton from '@components/ui/IconButton'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { cn } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuCopy } from 'react-icons/lu'

const NONE = '—'

export type SignalLevel = 'good' | 'fair' | 'weak'

/** Wi-Fi signal from the RSSI in dBm; `null` when the bulb never reported one. */
export const signalLevel = (rssi: number): SignalLevel | null => {
  if (rssi === 0) return null
  if (rssi > -60) return 'good'
  if (rssi > -72) return 'fair'
  return 'weak'
}

const SIGNAL_LABELS = {
  good: 'information.signal.good',
  fair: 'information.signal.fair',
  weak: 'information.signal.weak'
} as const

const BARS = { good: 3, fair: 2, weak: 1 } as const

export const useSignalLabel = () => {
  const { t } = useTranslation()
  return (rssi: number) => {
    const level = signalLevel(rssi)
    return level ? t(SIGNAL_LABELS[level]) : t('information.signal.unknown')
  }
}

/** Three bars, filled up to the signal level. */
export function SignalBars({ rssi }: { rssi: number }) {
  const { t } = useTranslation()
  const label = useSignalLabel()(rssi)
  const level = signalLevel(rssi)
  const filled = level ? BARS[level] : 0
  return (
    <span
      role="img"
      aria-label={t('information.signalOf', { level: label })}
      title={level ? `${rssi} dBm` : undefined}
      className="flex h-4 shrink-0 items-end gap-0.5"
    >
      {[6, 11, 16].map((height, i) => (
        <span
          key={height}
          className={cn('w-1 rounded-[1px]', i < filled ? 'bg-fg' : 'bg-track')}
          style={{ height }}
        />
      ))}
    </span>
  )
}

type BulbFactsProps = {
  bulb: BulbState
  /** Copy buttons next to the IP and MAC (Information page). */
  copyable?: boolean
  /** A first "Status" row (Details dialog). */
  status?: string
  className?: string
}

/** IP, MAC, model, firmware and signal of one bulb as a definition list. */
export default function BulbFacts({ bulb, copyable = false, status, className }: BulbFactsProps) {
  const { t } = useTranslation()
  const pushToast = useBulbStore((s) => s.pushToast)
  const signal = useSignalLabel()(bulb.rssi)

  const handleCopy = async (value: string, kind: 'ip' | 'mac') => {
    try {
      await navigator.clipboard.writeText(value)
      pushToast(kind === 'ip' ? 'information.copiedIp' : 'information.copiedMac', 'success')
    } catch {
      pushToast('information.copyFailed', 'error')
    }
  }

  const copyValue = (value: string, kind: 'ip' | 'mac') => {
    if (!value) return NONE
    if (!copyable) return <span className="tabular-nums">{value}</span>
    return (
      <span className="flex items-center gap-1.5">
        <span className="tabular-nums">{value}</span>
        <IconButton
          label={t(kind === 'ip' ? 'information.copyIp' : 'information.copyMac', {
            name: bulb.name
          })}
          onClick={() => void handleCopy(value, kind)}
          className="-my-1 size-7 rounded-[7px]"
        >
          <LuCopy size={14} aria-hidden />
        </IconButton>
      </span>
    )
  }

  const rows: [string, React.ReactNode][] = [
    ...(status ? [[t('information.fields.status'), status] as [string, string]] : []),
    [t('information.fields.ip'), copyValue(bulb.ip, 'ip')],
    [t('information.fields.mac'), copyValue(bulb.mac, 'mac')],
    [t('information.fields.model'), bulb.moduleName || NONE],
    [t('information.fields.firmware'), bulb.fwVersion || NONE],
    [
      t('information.fields.signal'),
      signalLevel(bulb.rssi) ? (
        <>
          {signal} <span className="text-muted">· {bulb.rssi} dBm</span>
        </>
      ) : (
        NONE
      )
    ]
  ]

  return (
    <dl
      className={cn(
        'grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5',
        className
      )}
    >
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
