import logo from '@assets/logo_sidebar.png'
import { useBulbStore } from '@renderer/context/BulbStore'
import { ReactNode, useState } from 'react'
import { LuCircleHelp, LuImages, LuInfo, LuLayoutDashboard, LuSettings } from 'react-icons/lu'
import { Link, useMatch } from 'react-router'
import BulbShortcut from './BulbShortcut'
import AboutModal from './modals/AboutModal'
import Separator from './ui/Separator'

export default function Sidebar() {
  const bulb = useBulbStore((state) => state.bulb)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  const renderMenuLink = (icon: ReactNode, label: string, ref: string) => {
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

  const renderMenuOption = (icon: ReactNode, label: string, onClick: () => void) => {
    return (
      <li>
        <button
          className="flex w-full gap-2 items-center transition duration-200 py-2 px-4 rounded-lg hover:scale-105 hover:bg-secondary"
          aria-label={label}
          onClick={onClick}
        >
          {icon}
          <span>{label}</span>
        </button>
      </li>
    )
  }

  return (
    <aside className="bg-sidebar-bg p-4 w-56 flex flex-col min-h-screen max-h-screen fixed">
      <img src={logo} alt="Wiz logo banner" width={100} className="mx-auto" />
      <Separator />

      <div className="flex-grow-1">
        <p className="text-neutral-500 text-xs subpixel-antialiased mb-3 ps-2">Menu</p>
        <ul className="text-white flex flex-col gap-2">
          {renderMenuLink(<LuLayoutDashboard size={20} />, 'Dashboard', '/')}
          {renderMenuLink(<LuImages size={20} />, 'Scenes', '/scenes')}
          {renderMenuLink(<LuInfo size={20} />, 'Information', '/information')}
        </ul>
      </div>

      {bulb && <BulbShortcut />}
      <Separator />

      <div>
        <ul className="text-white flex flex-col gap-2">
          {renderMenuOption(<LuSettings size={20} />, 'Settings', () => {})}
          {renderMenuOption(<LuCircleHelp size={20} />, 'Help', () => setIsAboutModalOpen(true))}
        </ul>
      </div>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </aside>
  )
}
