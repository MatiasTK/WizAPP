import BulbDot from '@components/BulbDot'
import Switch from '@components/ui/Switch'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
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

  const status = (bulb: BulbState) => {
    if (!bulb.online) return t('bulb.offlineLabel')
    if (!bulb.state) return t('bulb.off')
    const scene = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
    return t('bulb.statusOn', { scene: scene?.name ?? t('bulb.on'), value: bulb.dimming ?? 0 })
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
              selected ? 'bg-primary-soft' : 'hover:bg-raised'
            )}
          >
            <button
              type="button"
              aria-current={selected}
              onClick={() => onSelect(bulb.ip)}
              className={cn(
                'flex min-w-0 grow cursor-pointer items-center gap-2.5 rounded-md py-2.5 pl-2.5 text-left',
                focusRing
              )}
            >
              <BulbDot bulb={bulb} size={14} />
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn('truncate text-sm font-semibold', selected && 'text-primary-text')}
                >
                  {bulb.name}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 truncate text-xs tabular-nums',
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
                onToggle={() => void toggleBulb(bulb.ip)}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
