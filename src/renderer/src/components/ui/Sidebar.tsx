import logo from '@assets/logo_sidebar.png'
import BulbShortcut from '@components/BulbShortcut'
import Button from '@components/ui/Button'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuCircleHelp, LuImages, LuInfo, LuLamp, LuSearch, LuSettings } from 'react-icons/lu'
import { NavLink } from 'react-router'

type SidebarProps = {
  onOpenSearch: () => void
  onOpenSettings: () => void
  onOpenHelp: () => void
}

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-10 items-center gap-3 rounded-lg px-4 text-sm font-medium transition-colors',
    isActive ? 'bg-primary text-on-primary' : 'text-fg hover:bg-raised',
    focusRing
  )

export default function Sidebar({ onOpenSearch, onOpenSettings, onOpenHelp }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-4 overflow-y-auto bg-sidebar p-4">
      <img
        src={logo}
        alt="WiZ APP"
        width={88}
        className="mx-auto mt-1 shrink-0 invert dark:invert-0"
      />

      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          'flex h-10 w-full shrink-0 cursor-pointer items-center gap-3 rounded-lg bg-raised px-3.5 text-sm text-muted transition-colors hover:text-fg',
          focusRing
        )}
      >
        <LuSearch size={16} aria-hidden />
        <span className="grow text-left">{t('sidebar.search')}</span>
        <kbd aria-hidden className="rounded-sm bg-sidebar px-1.5 py-0.5 text-xs">
          Ctrl K
        </kbd>
      </button>

      <nav aria-label={t('sidebar.menu')} className="shrink-0">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink to="/" end className={linkClasses}>
              <LuLamp size={20} aria-hidden />
              {t('sidebar.home')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/scenes" className={linkClasses}>
              <LuImages size={20} aria-hidden />
              {t('sidebar.scenes')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/information" className={linkClasses}>
              <LuInfo size={20} aria-hidden />
              {t('sidebar.information')}
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="grow" />

      <BulbShortcut />

      <ul className="flex shrink-0 gap-2 border-t border-border pt-4">
        <li className="min-w-0 grow">
          <Button variant="ghost" className="w-full gap-2 px-2" onClick={onOpenSettings}>
            <LuSettings size={18} aria-hidden />
            {t('sidebar.settings')}
          </Button>
        </li>
        <li className="min-w-0 grow">
          <Button variant="ghost" className="w-full gap-2 px-2" onClick={onOpenHelp}>
            <LuCircleHelp size={18} aria-hidden />
            {t('sidebar.help')}
          </Button>
        </li>
      </ul>
    </aside>
  )
}
