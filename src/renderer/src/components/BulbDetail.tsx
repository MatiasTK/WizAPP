import BulbDot, { useBulbHex } from '@components/BulbDot'
import BrightnessSlider from '@components/ui/BrightnessSlider'
import Button from '@components/ui/Button'
import IconButton from '@components/ui/IconButton'
import Menu from '@components/ui/Menu'
import Spinner from '@components/ui/Spinner'
import Switch from '@components/ui/Switch'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useRetry } from '@renderer/hooks/useRetry'
import { useCatalog } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { ACCENT, accentStyle } from '@renderer/lib/light'
import { TINT } from '@renderer/lib/tint'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuChevronRight,
  LuClipboardList,
  LuEllipsis,
  LuPencil,
  LuPlugZap,
  LuTrash2,
  LuWifiOff
} from 'react-icons/lu'

type BulbDetailProps = {
  bulb: BulbState
  onRename: () => void
  onDetails: () => void
  onRemove: () => void
  onAllScenes: () => void
}

/**
 * Detail pane of the Bulbs page. It fills the height it is given: the header and brightness
 * stay put and only the favorites grid scrolls, so the page itself never has to.
 */
export default function BulbDetail({
  bulb,
  onRename,
  onDetails,
  onRemove,
  onAllScenes
}: BulbDetailProps) {
  const { t } = useTranslation()
  const { byId, favorites } = useCatalog()
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const setScene = useBulbStore((s) => s.setScene)
  const hex = useBulbHex(bulb)
  const { retrying, stillOffline, retry } = useRetry(bulb.ip)

  const offline = !bulb.online
  const lit = !offline && bulb.state
  const scene = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
  const status = offline
    ? t('bulb.offlineLabel')
    : lit
      ? t('bulb.statusOn', { scene: scene?.name ?? t('bulb.on'), value: bulb.dimming ?? 0 })
      : t('bulb.off')

  const menuItems = [
    { label: t('bulb.rename'), icon: <LuPencil size={15} />, onSelect: onRename },
    { label: t('bulb.details'), icon: <LuClipboardList size={15} />, onSelect: onDetails },
    { label: t('bulb.remove'), icon: <LuTrash2 size={15} />, onSelect: onRemove, destructive: true }
  ]

  const renderFavorites = () => {
    if (favorites.length === 0) {
      return <p className="text-[13px] text-muted">{t('scenes.missingFavorites')}</p>
    }
    return (
      <div className="-m-0.5 grid min-h-0 grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] content-start gap-1.5 overflow-y-auto p-0.5">
        {favorites.map((entry) => {
          const active = bulb.sceneId === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={active}
              // On a switched-off bulb a scene also turns it on; the name says so.
              aria-label={t(bulb.state ? 'bulb.applyTo' : 'bulb.applyToOff', {
                scene: entry.name,
                name: bulb.name
              })}
              title={entry.name}
              onClick={() => void setScene(entry.id, bulb.ip)}
              className={cn(
                'flex h-[38px] min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-sm border bg-sunken py-0 pr-2 pl-[7px] text-left text-[13px] whitespace-nowrap text-fg hover:bg-raised',
                active && lit ? 'border-(--accent) ring-1 ring-(--accent)' : 'border-border',
                focusRing
              )}
            >
              <span
                aria-hidden
                className="size-6 shrink-0 rounded-[6px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-fg)_12%,transparent)]"
                style={{ background: entry.swatch }}
              />
              <span className="truncate">{entry.name}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <section
      aria-label={bulb.name}
      // `--accent` (the bulb's color, readable on the card) for the favorite that is running.
      style={hex ? accentStyle(hex) : undefined}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface @xl:max-h-full',
        ACCENT
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-border py-3 pr-2.5 pl-4',
          lit && hex && TINT
        )}
        // The bulb's color behind the header while it is on.
        style={lit && hex ? ({ '--tint': hex } as CSSProperties) : undefined}
      >
        <BulbDot bulb={bulb} size={36} glow />
        <div className="flex min-w-0 grow flex-col">
          <div className="flex min-w-0 items-start gap-1">
            <h2
              title={bulb.name}
              className="line-clamp-2 text-base leading-tight font-bold break-words"
            >
              {bulb.name}
            </h2>
            <IconButton
              label={t('bulb.renameFor', { name: bulb.name })}
              onClick={onRename}
              className="size-7 rounded-[7px]"
            >
              <LuPencil size={14} aria-hidden />
            </IconButton>
          </div>
          <p
            className={cn(
              'flex items-center gap-1.5 truncate text-[13px] tabular-nums',
              // On the tinted header, grey would lose contrast: the foreground, softened.
              offline ? 'text-danger-text' : lit ? 'text-fg/75' : 'text-muted'
            )}
          >
            {offline && <LuWifiOff size={14} aria-hidden />}
            {status}
          </p>
        </div>
        {offline ? (
          <Button
            size="dense"
            variant="primary"
            disabled={retrying}
            onClick={() => void retry()}
            aria-label={t('bulb.retryFor', { name: bulb.name })}
          >
            {retrying ? <Spinner /> : <LuPlugZap size={14} aria-hidden />}
            {t('bulb.retry')}
          </Button>
        ) : (
          <Switch
            label={t('bulb.power', { name: bulb.name })}
            isOn={bulb.state}
            color={hex}
            onToggle={() => void toggleBulb(bulb.ip)}
          />
        )}
        <Menu
          items={menuItems}
          trigger={
            <IconButton label={t('bulb.more', { name: bulb.name })} tooltip={false}>
              <LuEllipsis size={18} aria-hidden />
            </IconButton>
          }
        />
      </div>

      {offline ? (
        <p role="status" className="p-4 text-[13px] text-muted">
          {stillOffline && (
            <span className="font-semibold text-danger-text">{t('bulb.stillOffline')} </span>
          )}
          {t('bulb.offline', { name: bulb.name })}
        </p>
      ) : (
        <div className="grid min-h-0 grow grid-rows-[auto_minmax(0,1fr)] gap-4 px-4 pt-3.5 pb-4 @5xl:grid-cols-[17.5rem_minmax(0,1fr)] @5xl:grid-rows-1 @5xl:gap-6">
          <div className="self-start">
            <BrightnessSlider
              ip={bulb.ip}
              name={bulb.name}
              dimming={bulb.dimming}
              color={lit ? hex : null}
              disabled={!lit}
              presets
            />
          </div>

          <section aria-label={t('scenes.favorites')} className="flex min-h-0 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between">
              <h3 className="text-sm font-semibold">{t('scenes.favorites')}</h3>
              <button
                type="button"
                onClick={onAllScenes}
                className={cn(
                  'flex cursor-pointer items-center gap-0.5 rounded-sm p-1 text-[13px] font-semibold text-primary-text',
                  focusRing
                )}
              >
                {t('bulb.allScenes')}
                <LuChevronRight size={14} aria-hidden />
              </button>
            </div>
            {renderFavorites()}
          </section>
        </div>
      )}
    </section>
  )
}
