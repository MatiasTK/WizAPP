import { CustomColor } from '@/types/customColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'
import { LuHeart, LuPlus, LuSquarePen, LuTrash } from 'react-icons/lu'
import CustomSceneItem from './CustomSceneItem'
import DeleteDialog from './modals/DeleteDialog'
import ModalCustomColor from './modals/ModalCustomColor'

type CustomSceneProps = {
  showBtnButton?: boolean
  nameFilter?: string
  onEmpty: (msg: string) => void
}

export default function CustomScene({
  showBtnButton = false,
  nameFilter,
  onEmpty
}: CustomSceneProps) {
  const bulb = useBulbStore((state) => state.bulb)
  const removeCustomColor = useBulbStore((state) => state.removeCustomColor)
  const toggleFavoriteColor = useBulbStore((state) => state.toggleFavoriteColor)

  const [isCustomColorModalOpen, setIsCustomColorModalOpen] = useState(false)

  const [selectedColor, setSelectedColor] = useState<CustomColor>()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleOpenDeleteDialog = (scene: CustomColor) => {
    setSelectedColor(scene)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setSelectedColor(undefined)
    setIsDeleteDialogOpen(false)
  }

  const handleRemoveCustomColor = () => {
    if (selectedColor) {
      removeCustomColor(selectedColor.id)
      handleCloseDeleteDialog()
    }
  }

  const handleEditCustomColor = (scene: CustomColor) => {
    setSelectedColor(scene)
    setIsCustomColorModalOpen(true)
  }

  const handleAddCustomColor = () => {
    setSelectedColor(undefined)
    setIsCustomColorModalOpen(true)
  }

  const handleToggleFavoriteColor = (scene: CustomColor) => {
    toggleFavoriteColor(scene.id)
  }

  const renderAddCustomSceneBtn = () => (
    <button
      className="h-full rounded-2xl px-4 py-6 lg:px-6 border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white font-medium flex items-center
  justify-center gap-2 cursor-pointer transition-all duration-200"
      onClick={handleAddCustomColor}
    >
      <LuPlus size={24} />
      <span>Add custom</span>
    </button>
  )

  const handleModalClose = () => {
    setIsCustomColorModalOpen(false)
  }

  if (!bulb.customColors || bulb.customColors.length === 0) {
    onEmpty('No custom colors found, try adding one first')
    if (showBtnButton) {
      return (
        <>
          {renderAddCustomSceneBtn()}

          <ModalCustomColor
            isOpen={isCustomColorModalOpen}
            onClose={handleModalClose}
            editingColor={selectedColor}
          />
        </>
      )
    }

    return null
  } else {
    onEmpty('')
  }

  const isFilteringByName = nameFilter && nameFilter.length > 0

  const filterByName = (color: CustomColor) =>
    !isFilteringByName || color.name.toLowerCase().includes(nameFilter!.toLowerCase())

  const customScenes = bulb.customColors.filter(filterByName)

  const areScenesEmpty = customScenes.length === 0

  if (areScenesEmpty && showBtnButton) {
    onEmpty('No custom colors found, try adding one first')
    return null
  }

  const getMenuOptions = (scene: CustomColor) => [
    {
      label: bulb.favoriteColors.includes(scene.id) ? 'Unfavorite' : 'Favorite',
      icon: <LuHeart size={20} />,
      onClick: () => handleToggleFavoriteColor(scene)
    },
    {
      label: 'Edit',
      icon: <LuSquarePen size={20} />,
      onClick: () => handleEditCustomColor(scene)
    },
    {
      label: 'Delete',
      icon: <LuTrash size={20} />,
      onClick: () => handleOpenDeleteDialog(scene)
    }
  ]

  return (
    <>
      {showBtnButton && renderAddCustomSceneBtn()}
      {customScenes.map((scene) => (
        <CustomSceneItem
          key={scene.id}
          id={scene.id}
          name={scene.name}
          color={scene.hex}
          kebabMenuOptions={getMenuOptions(scene)}
        />
      ))}
      <ModalCustomColor
        isOpen={isCustomColorModalOpen}
        onClose={() => setIsCustomColorModalOpen(false)}
        editingColor={selectedColor}
      />
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete custom color"
        description={`Are you sure you want to delete ${selectedColor?.name} custom color?`}
        onConfirm={handleRemoveCustomColor}
      />
    </>
  )
}
