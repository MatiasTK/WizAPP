import BulbDot from '@components/BulbDot'
import Switch from '@components/ui/Switch'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { bulbHex, useCatalog } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuWifiOff } from 'react-icons/lu'

type BulbListProps = {
  bulbs: BulbState[]
  selectedIp: string | null
  onSelect: (ip: string) => void
}

/** Master pane of the Bulbs page: one row per bulb (select it) with its own power switch. */
export default function BulbList({ bulbs, selectedIp, onSelect }: BulbListProps) {
  const { t } = useTranslation()
  const { byId } = useCatalog()
  const toggleBulb = useBulbStore((s) => s.toggleBulb)

  // Scene name and brightness apart: a long scene name truncates, the value never does.
  const status = (bulb: BulbState) => {
    if (!bulb.online) return t('bulb.offlineLabel')
    if (!bulb.state) return t('bulb.off')
    const scene = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
    return (
      <>
        <span className="min-w-0 truncate">{scene?.name ?? t('bulb.on')}</span>
        <span className="shrink-0">· {t('common.percent', { value: bulb.dimming ?? 0 })}</span>
      </>
    )
  }

  return (
    <ul aria-label={t('home.listLabel')} className="flex flex-col gap-0.5">
      {bulbs.map((bulb) => {
        const selected = bulb.ip === selectedIp
        return (
          <li
            key={bulb.ip}
            className={cn(
              'flex items-center gap-1 rounded-md pr-2 transition-colors',
              // Selection is a neutral highlight; color belongs to the light itself.
              selected ? 'bg-raised' : 'hover:bg-raised/60'
            )}
          >
            <button
              type="button"
              title={bulb.name}
              aria-current={selected}
              onClick={() => onSelect(bulb.ip)}
              className={cn(
                'flex min-w-0 grow cursor-pointer items-center gap-2.5 rounded-md py-2.5 pl-2.5 text-left',
                focusRing
              )}
            >
              <BulbDot bulb={bulb} size={14} />
              <span className="flex min-w-0 flex-col">
                <span className={cn('truncate text-sm', selected ? 'font-bold' : 'font-semibold')}>
                  {bulb.name}
                </span>
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1 text-xs whitespace-nowrap tabular-nums',
                    bulb.online ? 'text-muted' : 'text-danger-text'
                  )}
                >
                  {!bulb.online && <LuWifiOff size={12} aria-hidden />}
                  {status(bulb)}
                </span>
              </span>
            </button>
            {bulb.online && (
              <Switch
                size="sm"
                label={t('bulb.power', { name: bulb.name })}
                isOn={bulb.state}
                color={bulbHex(bulb, byId)}
                onToggle={() => void toggleBulb(bulb.ip)}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
