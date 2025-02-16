import { useBulbStore } from '@renderer/context/BulbStore'
import { LuPlus } from 'react-icons/lu'
import { scenes } from 'src/renderer/utils/scenesInfo'
import SceneItem from './SceneItem'

type Scene = {
  type?: string
  nameFilter?: string
  onEmpty: (msg: string) => void
}

export default function Scene({ type, nameFilter, onEmpty }: Scene) {
  const bulb = useBulbStore((state) => state.bulb)
  const setScene = useBulbStore((state) => state.setScene)

  const renderAddCustomSceneBtn = () => (
    <button
      className="h-full rounded-2xl px-4 py-6 lg:px-6 border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white font-medium flex items-center
  justify-center gap-2 cursor-pointer transition-all duration-200 "
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
  const areScenesEmpty = filteredScenes.length === 0

  if (isCustomType && areScenesEmpty) {
    onEmpty('No custom scenes found, try adding one first')
  } else if (areScenesEmpty) {
    onEmpty('No scenes found, try another search term')
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
    </>
  )
}
