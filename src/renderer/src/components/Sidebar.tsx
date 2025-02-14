import logo from '@assets/logo_sidebar.png'
import { useBulbStore } from '@renderer/context/BulbStore'
import { ReactNode } from 'react'
import { LuCircleHelp, LuImages, LuInfo, LuLayoutDashboard, LuSettings } from 'react-icons/lu'
import { Link, useMatch } from 'react-router'
import BulbShortcut from './BulbShortcut'
import Separator from './ui/Separator'

export default function Sidebar() {
  const bulb = useBulbStore((state) => state.bulb)

  const renderMenuItem = (icon: ReactNode, label: string, ref: string) => {
    const isActive = useMatch(ref)
    return (
      <li>
        <Link
          className={`flex gap-2 items-center transition duration-200 py-2 px-4 rounded-lg hover:scale-105 ${isActive ? 'bg-primary shadow-lg hover:bg-primary/50' : 'hover:bg-secondary'}`}
          aria-label={label}
          to={ref}
        >
          {icon}
          <span>{label}</span>
        </Link>
      </li>
    )
  }

  return (
    <aside className="h-screen bg-sidebar-bg p-4 w-56 flex flex-col">
      <img src={logo} alt="Wiz logo banner" width={100} className="mx-auto" />
      <Separator />

      <div className="flex-grow-1">
        <p className="text-neutral-500 text-xs subpixel-antialiased mb-3 ps-2">Menu</p>
        <ul className="text-white flex flex-col gap-2">
          {renderMenuItem(<LuLayoutDashboard size={20} />, 'Dashboard', '/')}
          {renderMenuItem(<LuImages size={20} />, 'Scenes', '/scenes')}
          {renderMenuItem(<LuInfo size={20} />, 'Information', '/information')}
        </ul>
      </div>

      {bulb && <BulbShortcut />}
      <Separator />

      <div>
        <ul className="text-white flex flex-col gap-2">
          {renderMenuItem(<LuSettings size={20} />, 'Settings', '/settings')}
          {renderMenuItem(<LuCircleHelp size={20} />, 'Help', '/help')}
        </ul>
      </div>
    </aside>
  )
}
