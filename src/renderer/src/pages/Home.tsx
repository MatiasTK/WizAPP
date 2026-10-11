import BulbCard from '@renderer/components/BulbCard'
import FavoriteScene from '@renderer/components/FavoriteScene'
import AddDeviceModal from '@renderer/components/modals/AddDeviceModal'
import DeleteDialog from '@renderer/components/modals/DeleteDialog'
import EditNameModal from '@renderer/components/modals/EditNameModal'
import SearchBulbCard from '@renderer/components/SearchBulbCard'
import Button from '@renderer/components/ui/Button'
import { useBulbStore } from '@renderer/context/BulbStore'
import { HomeModalState, ModalType } from '@renderer/types/modals'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCirclePlus, LuSquarePen, LuToggleLeft, LuTrash } from 'react-icons/lu'

export default function Home() {
  const { bulbs, activeBulb, isDiscovering, toggleBulbByIp, setActiveBulb, deleteBulb, isReady } =
    useBulbStore()
  const { t } = useTranslation()
  const [modals, setModals] = useState<HomeModalState>({
    edit: false,
    delete: false,
    ip: false
  })

  useEffect(() => {
    if (isReady) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          window.api.showWindow()
        })
      })
    }
  }, [isReady])

  // Track which bulb IP the kebab menu is targeting
  const [targetBulbIp, setTargetBulbIp] = useState<string | null>(null)

  const toggleModal = (modal: ModalType) => {
    setModals((prev) => ({ ...prev, [modal]: !prev[modal] }))
  }

  const handleDeleteBulb = () => {
    if (targetBulbIp) {
      deleteBulb(targetBulbIp)
    }
    toggleModal('delete')
    setTargetBulbIp(null)
  }

  // Build per-card menu items that target the specific bulb
  const getMenuItemsForBulb = useCallback(
    (ip: string) => [
      {
        label: t('home.toggle'),
        icon: <LuToggleLeft size={20} />,
        onClick: () => toggleBulbByIp(ip)
      },
      {
        label: t('home.edit.entry'),
        icon: <LuSquarePen size={20} />,
        onClick: () => {
          setTargetBulbIp(ip)
          toggleModal('edit')
        }
      },
      {
        label: t('home.delete.entry'),
        icon: <LuTrash size={20} />,
        onClick: () => {
          setTargetBulbIp(ip)
          toggleModal('delete')
        }
      }
    ],
    [t, toggleBulbByIp]
  )

  // Find the target bulb for delete dialog message
  const targetBulb = targetBulbIp ? bulbs.find((b) => b.ip === targetBulbIp) : activeBulb

  return (
    <section className="py-8 px-8">
      <h1 className="font-bold text-4xl">{t('home.title')}</h1>
      <h2 className="text-sm lg:text-lg mt-2 text-neutral-400 font-medium">{t('home.subtitle')}</h2>

      {activeBulb && (
        <p className="mt-10 text-sm text-neutral-400 font-medium">
          {t('home.selectedBulb')}:{' '}
          <span className="text-primary font-semibold">{activeBulb.name}</span>
        </p>
      )}

      <article className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4 lg:gap-y-6 lg:grid-cols-4 xl:grid-cols-5">
        {bulbs.map((b) => (
          <BulbCard
            key={b.ip}
            bulb={b}
            isActive={b.ip === activeBulb?.ip}
            onSelect={() => setActiveBulb(b.ip)}
            onToggle={() => toggleBulbByIp(b.ip)}
            menuItems={getMenuItemsForBulb(b.ip)}
          />
        ))}
        {isDiscovering && bulbs.length === 0 && <SearchBulbCard />}
        <Button
          variant="secondary"
          onClick={() => toggleModal('ip')}
          className="flex flex-col items-center justify-center w-full h-31 g-1"
        >
          <LuCirclePlus size={32} strokeWidth={1} />
          <p className="mt-2 text-lg">{t('home.add.entry')}</p>
        </Button>
      </article>

      {targetBulb && (
        <>
          <EditNameModal
            isOpen={modals.edit}
            onClose={() => toggleModal('edit')}
            targetBulb={targetBulb}
          />
          <DeleteDialog
            isOpen={modals.delete}
            onClose={() => toggleModal('delete')}
            title={t('home.delete.title')}
            description={`${t('home.delete.message')} "${targetBulb.name}"?`}
            onConfirm={handleDeleteBulb}
          />
        </>
      )}

      <AddDeviceModal isOpen={modals.ip} onClose={() => toggleModal('ip')} />

      <article className="mt-8 w-full">
        <FavoriteScene />
      </article>
    </section>
  )
}
