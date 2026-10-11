import logo from '@assets/logo_sidebar.png'
import BulbShortcut from '@components/BulbShortcut'
import MenuLink from '@components/MenuLink'
import HelpModal from '@components/modals/HelpModal'
import SettingsModal from '@components/modals/SettingsModal'
import Button from '@components/ui/Button'
import Separator from '@components/ui/Separator'
import { useBulbStore } from '@renderer/context/BulbStore'
import { SidebarModalState } from '@renderer/types/modals'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCircleHelp, LuImages, LuInfo, LuLamp, LuSettings } from 'react-icons/lu'

export default function Sidebar() {
  const { t } = useTranslation()
  const bulb = useBulbStore((state) => state.activeBulb)
  const [modals, setModals] = useState<SidebarModalState>({
    about: false,
    settings: false
  })

  const toggleModal = (modal: keyof SidebarModalState) => {
    setModals((prev) => ({ ...prev, [modal]: !prev[modal] }))
  }

  const renderMenuOption = (icon: ReactNode, label: string, onClick: () => void) => {
    return (
      <li>
        <Button
          className="flex w-full gap-2 items-center transition duration-200 py-2 px-4 border-none rounded-lg hover:scale-105 hover:bg-secondary cursor-pointer"
          variant="ghost"
          aria-label={label}
          onClick={onClick}
        >
          {icon}
          <span>{label}</span>
        </Button>
      </li>
    )
  }

  return (
    <aside className="bg-sidebar-bg p-4 w-56 flex flex-col min-h-screen max-h-screen fixed">
      <img src={logo} alt="Wiz logo banner" width={100} className="mx-auto" />
      <Separator />

      <div className="flex-grow-1">
        <p className="text-neutral-500 text-xs subpixel-antialiased mb-3 ps-2">
          {t('sidebar.menu')}
        </p>
        <ul className="text-white flex flex-col gap-2">
          <MenuLink index={0} label={t('sidebar.home')} to="/" icon={<LuLamp size={20} />} />
          <MenuLink
            index={1}
            label={t('sidebar.scenes')}
            to="/scenes"
            icon={<LuImages size={20} />}
          />
          <MenuLink
            index={2}
            label={t('sidebar.information')}
            to="/information"
            icon={<LuInfo size={20} />}
          />
        </ul>
      </div>

      {bulb && <BulbShortcut />}
      <Separator />

      <div>
        <ul className="text-white flex flex-col gap-2">
          {renderMenuOption(<LuSettings size={20} />, t('sidebar.settings'), () =>
            toggleModal('settings')
          )}
          {renderMenuOption(<LuCircleHelp size={20} />, t('sidebar.help'), () =>
            toggleModal('about')
          )}
        </ul>
      </div>

      <HelpModal isOpen={modals.about} onClose={() => toggleModal('about')} />
      <SettingsModal isOpen={modals.settings} onClose={() => toggleModal('settings')} />
    </aside>
  )
}
