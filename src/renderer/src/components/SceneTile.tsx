import IconButton from '@components/ui/IconButton'
import Menu, { type MenuItem } from '@components/ui/Menu'
import Tooltip from '@components/ui/Tooltip'
import type { CatalogEntry } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCheck, LuEllipsisVertical, LuHeart } from 'react-icons/lu'

export type SceneTileProps = {
  entry: CatalogEntry
  active: boolean
  disabled?: boolean
  favorite: boolean
  onApply: () => void
  onToggleFavorite: () => void
  /** Extra actions (edit, delete) for custom colors. */
  menuItems?: MenuItem[]
  /** Drag handle of a sortable favorite. */
  handle?: ReactNode
  className?: string
}

/** One tile for built-in scenes, custom colors and favorites. */
export default function SceneTile({
  entry,
  active,
  disabled,
  favorite,
  onApply,
  onToggleFavorite,
  menuItems,
  handle,
  className
}: SceneTileProps) {
  const { t } = useTranslation()
  const Icon = entry.icon

  return (
    <div
      className={cn(
        'flex h-14 min-w-0 items-center gap-1 rounded-lg pr-2 transition-colors',
        active ? 'bg-primary text-on-primary' : 'bg-surface text-fg',
        className
      )}
    >
      {handle}
      <Tooltip content={entry.name}>
        <button
          type="button"
          aria-pressed={active}
          disabled={disabled}
          onClick={onApply}
          className={cn(
            'flex h-full min-w-0 grow cursor-pointer items-center gap-3 rounded-lg pr-1 text-left text-sm font-medium',
            handle ? 'pl-1' : 'pl-4',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !active && !disabled && 'hover:bg-raised',
            focusRing
          )}
        >
          {Icon ? (
            <Icon size={20} aria-hidden className="shrink-0" />
          ) : (
            <span
              aria-hidden
              className="size-5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.hex }}
            />
          )}
          <span className="min-w-0 grow truncate">{entry.name}</span>
          {active && <LuCheck size={16} aria-hidden className="shrink-0" />}
        </button>
      </Tooltip>
      <IconButton
        label={t(favorite ? 'scenes.favorite.remove' : 'scenes.favorite.add', { name: entry.name })}
        aria-pressed={favorite}
        onClick={onToggleFavorite}
        tooltip={false}
        className={cn(
          active ? 'text-on-primary hover:bg-primary-hover hover:text-on-primary' : undefined,
          favorite && !active && 'text-heart'
        )}
      >
        <LuHeart size={18} aria-hidden fill={favorite ? 'currentColor' : 'none'} />
      </IconButton>
      {menuItems && menuItems.length > 0 && (
        <Menu
          items={menuItems}
          trigger={
            <IconButton
              label={t('scenes.color.options', { name: entry.name })}
              tooltip={false}
              className={
                active ? 'text-on-primary hover:bg-primary-hover hover:text-on-primary' : undefined
              }
            >
              <LuEllipsisVertical size={18} aria-hidden />
            </IconButton>
          }
        />
      )}
    </div>
  )
}
