import BulbDot, { useBulbHex } from '@components/BulbDot'
import BrightnessSlider from '@components/ui/BrightnessSlider'
import Button from '@components/ui/Button'
import Switch from '@components/ui/Switch'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuChevronDown,
  LuChevronRight,
  LuClipboardList,
  LuPencil,
  LuPlugZap,
  LuTrash2,
  LuWifiOff
} from 'react-icons/lu'

const QUICK_FAVORITES = 5

type BulbCardProps = {
  bulb: BulbState
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onRename: () => void
  onDetails: () => void
  onRemove: () => void
  onAllScenes: () => void
}

/**
 * One card per bulb. Closed: dot, name, status, switch and a few favorites. Open (full row):
 * brightness, favorites and the bulb's actions. Every control acts on this bulb directly.
 */
export default function BulbCard({
  bulb,
  expanded: wantsExpanded,
  onExpandedChange,
  onRename,
  onDetails,
  onRemove,
  onAllScenes
}: BulbCardProps) {
  const { t } = useTranslation()
  const { byId, favorites } = useCatalog()
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const setScene = useBulbStore((s) => s.setScene)
  const probeBulb = useBulbStore((s) => s.probeBulb)
  const hex = useBulbHex(bulb)
  const panelId = useId()

  const offline = !bulb.online
  const lit = !offline && bulb.state
  // An offline bulb cannot be adjusted, so its card does not open.
  const expanded = wantsExpanded && !offline
  const scene = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined

  const status = offline
    ? t('bulb.offlineLabel')
    : lit
      ? t('bulb.statusOn', { scene: scene?.name ?? t('bulb.on'), value: bulb.dimming ?? 0 })
      : t('bulb.off')

  const heading = (
    <>
      <BulbDot bulb={bulb} size={40} glow />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold">{bulb.name}</span>
        <span
          className={cn(
            'flex items-center gap-1.5 text-[13px]',
            offline ? 'text-danger-text' : 'text-muted'
          )}
        >
          {offline && <LuWifiOff size={14} aria-hidden />}
          {status}
        </span>
      </span>
    </>
  )

  return (
    <article
      aria-label={bulb.name}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border-[1.5px] bg-surface',
        expanded ? 'col-span-full border-primary' : 'border-border'
      )}
    >
      <div
        className="flex items-center gap-1 py-1.5 pr-3.5 pl-1.5"
        // ~8 % of the bulb's color behind the header while it is on.
        style={{ backgroundColor: lit && hex ? `${hex}14` : undefined }}
      >
        {offline ? (
          <div className="flex min-w-0 grow items-center gap-3.5 p-3">{heading}</div>
        ) : (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={expanded ? panelId : undefined}
            aria-label={t(expanded ? 'bulb.close' : 'bulb.open', { name: bulb.name })}
            onClick={() => onExpandedChange(!expanded)}
            className={cn(
              'flex min-w-0 grow cursor-pointer items-center gap-3.5 rounded-[12px] p-3 text-left text-fg',
              focusRing
            )}
          >
            {heading}
            <LuChevronDown
              size={16}
              aria-hidden
              className={cn(
                'ml-auto shrink-0 text-muted transition-transform',
                expanded && 'rotate-180'
              )}
            />
          </button>
        )}
        {offline ? (
          <Button
            size="dense"
            variant="primary"
            onClick={() => void probeBulb(bulb.ip)}
            aria-label={t('bulb.retryFor', { name: bulb.name })}
          >
            <LuPlugZap size={14} aria-hidden />
            {t('bulb.retry')}
          </Button>
        ) : (
          <Switch
            label={t('bulb.power', { name: bulb.name })}
            isOn={bulb.state}
            onToggle={() => void toggleBulb(bulb.ip)}
          />
        )}
      </div>

      {!offline && !expanded && favorites.length > 0 && (
        <div className="mx-3.5 flex items-center gap-2 border-t border-border px-1 pt-3.5 pb-4">
          {favorites.slice(0, QUICK_FAVORITES).map((entry) => (
            <button
              key={entry.id}
              type="button"
              title={entry.name}
              aria-label={t('bulb.applyTo', { scene: entry.name, name: bulb.name })}
              aria-pressed={bulb.sceneId === entry.id}
              onClick={() => void setScene(entry.id, bulb.ip)}
              className={cn(
                'size-[26px] shrink-0 cursor-pointer rounded-sm',
                bulb.sceneId === entry.id &&
                  'ring-2 ring-primary ring-offset-2 ring-offset-surface',
                focusRing
              )}
              style={{ background: entry.swatch }}
            />
          ))}
          <span className="ml-1.5 text-xs text-muted">{t('scenes.favorites')}</span>
        </div>
      )}

      {expanded && (
        <div
          id={panelId}
          className="flex flex-wrap gap-6 border-t border-border px-5 pt-[18px] pb-5"
        >
          <div className="flex flex-[1_1_260px] flex-col gap-[18px]">
            <BrightnessSlider ip={bulb.ip} name={bulb.name} dimming={bulb.dimming} presets />
            <div className="flex flex-wrap gap-2">
              <Button className="text-[13px] font-medium" onClick={onRename}>
                <LuPencil size={15} aria-hidden />
                {t('bulb.rename')}
              </Button>
              <Button className="text-[13px] font-medium" onClick={onDetails}>
                <LuClipboardList size={15} aria-hidden />
                {t('bulb.details')}
              </Button>
              <Button variant="danger-soft" className="text-[13px] font-medium" onClick={onRemove}>
                <LuTrash2 size={15} aria-hidden />
                {t('bulb.remove')}
              </Button>
            </div>
          </div>

          <section
            aria-label={t('scenes.favorites')}
            className="flex flex-[2_1_380px] flex-col gap-2.5"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold">{t('scenes.favorites')}</h3>
              <button
                type="button"
                onClick={onAllScenes}
                className={cn(
                  'flex cursor-pointer items-center gap-1 rounded-sm p-1 text-[13px] font-semibold text-primary-text',
                  focusRing
                )}
              >
                {t('bulb.allScenes')}
                <LuChevronRight size={14} aria-hidden />
              </button>
            </div>
            {favorites.length === 0 ? (
              <p className="text-[13px] text-muted">{t('scenes.missingFavorites')}</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
                {favorites.map((entry) => {
                  const active = bulb.sceneId === entry.id
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => void setScene(entry.id, bulb.ip)}
                      className={cn(
                        'flex h-[42px] min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md border-[1.5px] bg-surface py-0 pr-2 pl-1.5 text-left text-[13px] whitespace-nowrap text-fg hover:bg-raised',
                        active ? 'border-primary' : 'border-border',
                        focusRing
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-7 shrink-0 rounded-[7px]"
                        style={{ background: entry.swatch }}
                      />
                      <span className="truncate">{entry.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </article>
  )
}
