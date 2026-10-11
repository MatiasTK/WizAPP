import CustomSceneItem from '@components/CustomSceneItem'
import CustomColorModal from '@components/modals/CustomColorModal'
import DeleteDialog from '@components/modals/DeleteDialog'
import { useBulbStore } from '@renderer/context/BulbStore'
import { CustomColor } from '@shared/types/customColor'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuHeart, LuPlus, LuSquarePen, LuTrash } from 'react-icons/lu'

type CustomSceneProps = {
  showBtnButton?: boolean
  nameFilter?: string
  onFilter: (value) => void
}

export default function CustomScene({
  showBtnButton = false,
  nameFilter,
  onFilter
}: CustomSceneProps) {
  const { t } = useTranslation()
  const bulb = useBulbStore((state) => state.activeBulb)
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
  justify-center gap-2 cursor-pointer transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-primary"
      onClick={handleAddCustomColor}
      disabled={!bulb}
    >
      <LuPlus size={24} />
      <span>{t('scenes.custom.add.entry')}</span>
    </button>
  )

  const handleModalClose = () => {
    setIsCustomColorModalOpen(false)
  }

  const isFilteringByName = nameFilter && nameFilter.length > 0

  const safeCustomColors = bulb?.customColors || []

  const filterByName = (color: CustomColor) =>
    !isFilteringByName || color.name.toLowerCase().includes(nameFilter!.toLowerCase())

  const customScenes = safeCustomColors.filter(filterByName)
  const areScenesEmpty = customScenes.length === 0

  useEffect(() => {
    if (!bulb || !bulb.customColors || bulb.customColors.length === 0) return

    if (areScenesEmpty && showBtnButton) {
      onFilter(false)
    } else {
      onFilter(true)
    }
  }, [areScenesEmpty, showBtnButton, onFilter, bulb])

  if (!bulb || !bulb.customColors || bulb.customColors.length === 0) {
    if (showBtnButton) {
      return (
        <>
          {renderAddCustomSceneBtn()}

          <CustomColorModal
            isOpen={isCustomColorModalOpen}
            onClose={handleModalClose}
            editingColor={selectedColor}
          />
        </>
      )
    }

    return null
  }

  if (areScenesEmpty && showBtnButton) {
    return null
  }

  const getMenuOptions = (scene: CustomColor) => [
    {
      label: bulb.favoriteColors.includes(scene.id)
        ? t('scenes.custom.unfav')
        : t('scenes.custom.fav'),
      icon: <LuHeart size={20} />,
      onClick: () => handleToggleFavoriteColor(scene)
    },
    {
      label: t('scenes.custom.edit.entry'),
      icon: <LuSquarePen size={20} />,
      onClick: () => handleEditCustomColor(scene)
    },
    {
      label: t('scenes.custom.delete.entry'),
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
      <CustomColorModal
        isOpen={isCustomColorModalOpen}
        onClose={() => setIsCustomColorModalOpen(false)}
        editingColor={selectedColor}
      />
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title={t('scenes.custom.delete.title')}
        description={`${t('scenes.custom.delete.message')} "${selectedColor?.name}"?`}
        onConfirm={handleRemoveCustomColor}
      />
    </>
  )
}
