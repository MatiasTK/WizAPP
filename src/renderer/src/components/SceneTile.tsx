import IconButton from '@components/ui/IconButton'
import Menu, { type MenuItem } from '@components/ui/Menu'
import type { CatalogEntry } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { ACCENT, accentStyle } from '@renderer/lib/light'
import { useTranslation } from 'react-i18next'
import { LuActivity, LuCheck, LuEllipsis, LuHeart } from 'react-icons/lu'

export type SceneTileProps = {
  entry: CatalogEntry
  active: boolean
  disabled?: boolean
  favorite: boolean
  onApply: () => void
  onToggleFavorite: () => void
  /** Extra actions (edit, delete) for custom colors. */
  menuItems?: MenuItem[]
  /** Accessible name of the tile, e.g. "Apply Party to Living room". The entry name if omitted. */
  applyLabel?: string
  /** Color of the bulb running this entry: marks the active tile. Primary when omitted. */
  color?: string | null
}

/** One tile for built-in scenes, custom colors and favorites: swatch, name and heart. */
export default function SceneTile({
  entry,
  active,
  disabled,
  favorite,
  onApply,
  onToggleFavorite,
  menuItems,
  applyLabel,
  color
}: SceneTileProps) {
  const { t } = useTranslation()
  const hasMenu = menuItems !== undefined && menuItems.length > 0

  return (
    <div
      className={cn('group relative min-w-0', color && ACCENT)}
      style={color ? accentStyle(color) : undefined}
    >
      <button
        type="button"
        aria-pressed={active}
        aria-label={`${applyLabel ?? entry.name}${entry.group === 'dynamic' ? `, ${t('scenes.dynamic')}` : ''}`}
        disabled={disabled}
        onClick={onApply}
        className={cn(
          'flex w-full cursor-pointer flex-col gap-2 rounded-[14px] border-[1.5px] bg-surface p-1.5 text-left text-fg transition-colors',
          active
            ? color
              ? 'border-(--accent) ring-1 ring-(--accent)'
              : 'border-primary'
            : 'border-border hover:border-outline',
          'disabled:cursor-not-allowed disabled:opacity-50',
          focusRing
        )}
      >
        <span
          aria-hidden
          className="relative h-16 w-full rounded-md shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-fg)_12%,transparent)]"
          style={{ background: entry.swatch }}
        >
          {/* The scene the bulb is giving: the same round chip and icon colors as the heart. */}
          {active && (
            <span className="absolute top-1.5 left-1.5 flex size-[30px] items-center justify-center rounded-full bg-knob/90 dark:bg-black/60">
              <LuCheck
                size={16}
                strokeWidth={3}
                aria-hidden
                className="text-knob-fg dark:text-white"
              />
            </span>
          )}
        </span>
        <span className={cn('flex w-full items-center gap-1.5 px-1 pb-0.5', hasMenu && 'pr-7')}>
          <span title={entry.name} className="min-w-0 grow truncate text-[13px] font-semibold">
            {entry.name}
          </span>
          {entry.group === 'dynamic' && (
            <span title={t('scenes.dynamic')} className="shrink-0 text-muted">
              <LuActivity size={13} aria-hidden />
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        aria-pressed={favorite}
        aria-label={t(favorite ? 'scenes.favorite.remove' : 'scenes.favorite.add', {
          name: entry.name
        })}
        // Favorites are global, so they stay editable while the bulb is offline.
        data-favorite-for={entry.id}
        onClick={onToggleFavorite}
        className={cn(
          'absolute top-3 right-3 flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-knob/90 transition-opacity dark:bg-black/60',
          favorite
            ? 'text-heart'
            : 'text-knob-fg opacity-60 group-focus-within:opacity-100 group-hover:opacity-100 dark:text-white',
          focusRing
        )}
      >
        <LuHeart size={16} aria-hidden fill={favorite ? 'currentColor' : 'none'} />
      </button>

      {hasMenu && (
        <div className="absolute right-1.5 bottom-1">
          <Menu
            items={menuItems}
            trigger={
              <IconButton
                label={t('scenes.color.options', { name: entry.name })}
                tooltip={false}
                className="size-7 rounded-[7px]"
              >
                <LuEllipsis size={16} aria-hidden />
              </IconButton>
            }
          />
        </div>
      )}
    </div>
  )
}
