import IconButton from '@components/ui/IconButton'
import Menu, { type MenuItem } from '@components/ui/Menu'
import type { CatalogEntry } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuActivity, LuEllipsis, LuHeart } from 'react-icons/lu'

export type SceneTileProps = {
  entry: CatalogEntry
  active: boolean
  disabled?: boolean
  favorite: boolean
  onApply: () => void
  onToggleFavorite: () => void
  /** Extra actions (edit, delete) for custom colors. */
  menuItems?: MenuItem[]
}

/** One tile for built-in scenes, custom colors and favorites: swatch, name and heart. */
export default function SceneTile({
  entry,
  active,
  disabled,
  favorite,
  onApply,
  onToggleFavorite,
  menuItems
}: SceneTileProps) {
  const { t } = useTranslation()
  const hasMenu = menuItems !== undefined && menuItems.length > 0

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        aria-pressed={active}
        aria-label={entry.name}
        disabled={disabled}
        onClick={onApply}
        className={cn(
          'flex w-full cursor-pointer flex-col gap-2 rounded-[14px] border-[1.5px] bg-surface p-1.5 text-left text-fg transition-colors',
          active ? 'border-primary' : 'border-border hover:border-outline',
          'disabled:cursor-not-allowed disabled:opacity-50',
          focusRing
        )}
      >
        <span
          aria-hidden
          className="h-16 w-full rounded-md"
          style={{ background: entry.swatch }}
        />
        <span className={cn('flex w-full items-center gap-1.5 px-1 pb-0.5', hasMenu && 'pr-7')}>
          <span className="min-w-0 grow truncate text-[13px] font-semibold">{entry.name}</span>
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
        onClick={onToggleFavorite}
        className={cn(
          'absolute top-3 right-3 flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-knob/90',
          favorite ? 'text-heart' : 'text-knob-fg',
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
