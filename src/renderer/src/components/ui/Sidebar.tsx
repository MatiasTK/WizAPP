import BulbShortcut from '@components/BulbShortcut'
import Logo from '@components/Logo'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuCircleHelp, LuInfo, LuLightbulb, LuPalette, LuSearch, LuSettings } from 'react-icons/lu'
import { NavLink } from 'react-router'

type SidebarProps = {
  onOpenSearch: () => void
  onOpenSettings: () => void
  onOpenHelp: () => void
}

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-[38px] items-center gap-2.5 rounded-[9px] px-3 transition-colors',
    isActive
      ? 'bg-primary-soft font-semibold text-primary-text'
      : 'font-medium text-fg hover:bg-raised',
    focusRing
  )

const footerButton = cn(
  'flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm text-[13px] text-fg transition-colors hover:bg-raised',
  focusRing
)

/** Full-height sidebar; it never scrolls with the page (only `main` does). */
export default function Sidebar({ onOpenSearch, onOpenSettings, onOpenHelp }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-border bg-sidebar px-3.5 py-[18px]">
      <div className="flex shrink-0 px-2.5 pt-3 pb-1">
        <Logo />
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          'flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 rounded-[9px] border border-border bg-sunken px-2.5 text-[13px] text-muted transition-colors hover:text-fg',
          focusRing
        )}
      >
        <LuSearch size={15} aria-hidden />
        <span className="grow text-left">{t('sidebar.search')}</span>
        <kbd
          aria-hidden
          className="rounded-[5px] border border-border bg-surface px-1.5 font-sans text-[11px]"
        >
          Ctrl K
        </kbd>
      </button>

      <nav aria-label={t('sidebar.menu')} className="shrink-0">
        <ul className="flex flex-col gap-0.5">
          <li>
            <NavLink to="/" end className={linkClasses}>
              <LuLightbulb size={18} aria-hidden />
              {t('sidebar.home')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/scenes" className={linkClasses}>
              <LuPalette size={18} aria-hidden />
              {t('sidebar.scenes')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/information" className={linkClasses}>
              <LuInfo size={18} aria-hidden />
              {t('sidebar.information')}
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="grow" />

      <BulbShortcut />

      <div className="flex shrink-0 gap-1 border-t border-border pt-3">
        <button type="button" className={footerButton} onClick={onOpenSettings}>
          <LuSettings size={16} aria-hidden />
          {t('sidebar.settings')}
        </button>
        <button type="button" className={footerButton} onClick={onOpenHelp}>
          <LuCircleHelp size={16} aria-hidden />
          {t('sidebar.help')}
        </button>
      </div>
    </aside>
  )
}
