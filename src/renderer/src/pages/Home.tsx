import AddDeviceModal from '@renderer/components/modals/AddDeviceModal'
import DeleteDialog from '@renderer/components/modals/DeleteDialog'
import EditNameModal from '@renderer/components/modals/EditNameModal'
import KebabMenu from '@renderer/components/ui/KebabMenu'
import PowerButton from '@renderer/components/ui/PowerButton'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'
import { LuCirclePlus, LuLoaderCircle, LuSquarePen, LuToggleLeft, LuTrash } from 'react-icons/lu'

export default function Home() {
  const bulb = useBulbStore((state) => state.bulb)
  const toggleBulb = useBulbStore((state) => state.toggleBulb)

  const [isEditModalOpened, setIsEditModalOpened] = useState(false)
  const [isDeleteDialogOpened, setIsDeleteDialogOpened] = useState(false)
  const [isIpModalOpened, setIsIpModalOpened] = useState(false)

  const handleToggleEditModal = () => {
    setIsEditModalOpened((prev) => !prev)
  }

  const handleToggleDeleteDialog = () => {
    setIsDeleteDialogOpened((prev) => !prev)
  }

  const handleToggleIpModal = () => {
    setIsIpModalOpened((prev) => !prev)
  }

  const handleToggleBulb = () => {
    toggleBulb()
  }

  const bulbCard = () => (
    <div
      className={`${bulb.state ? 'bg-primary' : 'bg-secondary'} rounded-lg py-3 px-4 w-48  transition-colors ease-in-out duration-300`}
    >
      <div className="animate-fade-in animate-steps-modern">
        <p className="text-lg">{bulb.name}</p>
        <span className="text-neutral-300">{bulb.state ? 'on' : 'off'}</span>

        <div className="mt-4 flex justify-between items-center">
          <PowerButton />
          <KebabMenu items={menuItems} />
        </div>
      </div>
    </div>
  )

  const searchBulbCard = () => (
    <div className="bg-primary w-48 h-31 rounded-lg py-3 px-4 flex flex-col items-center justify-center transition-all duration-300">
      <span className="animate-spin-clockwise animate-iteration-count-infinite animate-steps-modern animate-duration-800">
        <LuLoaderCircle size={32} />
      </span>
      <p className="mt-2">Searching bulbs</p>
    </div>
  )

  const menuItems = [
    {
      label: 'Toggle',
      icon: <LuToggleLeft size={20} />,
      onClick: handleToggleBulb
    },
    {
      label: 'Change name',
      icon: <LuSquarePen size={20} />,
      onClick: handleToggleEditModal
    },
    {
      label: 'Delete',
      icon: <LuTrash size={20} />,
      onClick: handleToggleDeleteDialog
    }
  ]

  return (
    <section className="py-8 px-8">
      <h1 className="font-bold text-4xl">Dashboard</h1>
      <article className="mt-14 grid grid-cols-3 gap-8 w-fit">
        {bulb ? bulbCard() : searchBulbCard()}
        <button
          className="bg-secondary-400/50 w-48 rounded-lg py-2 px-4 flex flex-col items-center cursor-pointer justify-center hover:bg-secondary-400/75 transition-all duration-300"
          onClick={handleToggleIpModal}
        >
          <LuCirclePlus size={32} strokeWidth={1} />
          <p className="mt-2 text-lg">Add device</p>
        </button>
      </article>
      {bulb && <EditNameModal isOpen={isEditModalOpened} onClose={handleToggleEditModal} />}
      {bulb && (
        <DeleteDialog
          isOpen={isDeleteDialogOpened}
          onClose={handleToggleDeleteDialog}
          title="Delete Bulb"
          description="Are you sure you want to delete this bulb?"
          onConfirm={() => console.log('Delete bulb')}
        />
      )}
      <AddDeviceModal isOpen={isIpModalOpened} onClose={handleToggleIpModal} />
    </section>
  )
}
