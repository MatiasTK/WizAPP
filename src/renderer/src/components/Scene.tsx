import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { scenes } from 'src/renderer/utils/scenesInfo'
import CustomSceneItem from './CustomSceneItem'
import SceneItem from './SceneItem'
import DeleteDialog from './modals/DeleteDialog'
import ModalCustomColor from './modals/ModalCustomColor'

type Scene = {
  type?: string
  nameFilter?: string
  onEmpty: (msg: string) => void
}

export default function Scene({ type, nameFilter, onEmpty }: Scene) {
  const bulb = useBulbStore((state) => state.bulb)
  const setScene = useBulbStore((state) => state.setScene)
  const removeCustomColor = useBulbStore((state) => state.removeCustomColor)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<(typeof scenes)[0] | null>(null)

  const renderAddCustomSceneBtn = () => (
    <button
      className="h-full rounded-2xl px-4 py-6 lg:px-6 border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white font-medium flex items-center
  justify-center gap-2 cursor-pointer transition-all duration-200 "
      onClick={() => setIsModalOpen(true)}
    >
      <LuPlus size={24} />
      <span>Add custom</span>
    </button>
  )

  const isShowingAll = !type
  const isCustomType = type === 'custom'
  const isFilteringByName = nameFilter && nameFilter.length > 0

  const filterByType = (scene: (typeof scenes)[0]) => isShowingAll || scene.type === type
  const filterByName = (scene: (typeof scenes)[0]) =>
    !isFilteringByName || scene.name.toLowerCase().includes(nameFilter!.toLowerCase())

  const filteredScenes = scenes.filter(filterByType).filter(filterByName)
  const customScenes = bulb.customColors

  const areScenesEmpty = filteredScenes.length === 0 && customScenes.length === 0

  if (isCustomType && areScenesEmpty) {
    onEmpty('No custom scenes found, try adding one first')
  } else if (areScenesEmpty) {
    onEmpty('No scenes found, try another search term')
  }

  const handleAddToFavorites = (scene) => {
    console.log('Add to favorites')
  }

  const handleEditItem = (scene) => {
    setSelectedItem(scene)
  }

  const handleOpenDeleteDialog = (scene) => {
    setSelectedItem(scene)
    setIsDialogOpen(true)
  }

  const handleDeleteItem = () => {
    if (!selectedItem) {
      console.error('No item selected')
      return
    }

    removeCustomColor(selectedItem.id)
    setIsDialogOpen(false)
  }

  return (
    <>
      {isCustomType && renderAddCustomSceneBtn()}
      {filteredScenes.map((scene) => (
        <SceneItem
          key={scene.id}
          name={scene.name}
          icon={scene.icon}
          active={bulb.sceneId === scene.id}
          onClick={() => setScene(scene.id)}
        />
      ))}
      {(isShowingAll || isCustomType) &&
        customScenes.map((scene) => (
          <CustomSceneItem
            key={scene.id}
            name={scene.name}
            color={scene.hex}
            active={bulb.sceneId === scene.id}
            onClick={() => setScene(scene.id)}
            onFavorite={() => handleAddToFavorites(scene)}
            onEdit={() => handleEditItem(scene)}
            onDelete={() => handleOpenDeleteDialog(scene)}
          />
        ))}

      {isCustomType && (
        <>
          <ModalCustomColor isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          <DeleteDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Delete Custom Color"
            description="Are you sure you want to delete this custom color?"
            onConfirm={handleDeleteItem}
          />
        </>
      )}
    </>
  )
}
