import { useBulbStore } from '@renderer/context/BulbStore'
import { scenes } from 'src/renderer/utils/scenesInfo'
import SceneItem from './SceneItem'

type Scene = {
  type?: string
  nameFilter?: string
  onEmpty: (msg: string) => void
}

export default function Scene({ type, nameFilter, onEmpty }: Scene) {
  const bulb = useBulbStore((state) => state.bulb)

  const isShowingAll = !type
  const isFilteringByName = nameFilter && nameFilter.length > 0

  const filterByType = (scene: (typeof scenes)[0]) => isShowingAll || scene.type === type
  const filterByName = (scene: (typeof scenes)[0]) =>
    !isFilteringByName || scene.name.toLowerCase().includes(nameFilter!.toLowerCase())

  const filteredScenes = scenes.filter(filterByType).filter(filterByName)
  const customScenes = bulb ? bulb.customColors : []

  const areScenesEmpty = filteredScenes.length === 0 && customScenes.length === 0

  if (areScenesEmpty) {
    onEmpty('No scenes found, try another search term')
  }

  return (
    <>
      {filteredScenes.map((scene) => (
        <SceneItem id={scene.id} key={scene.id} name={scene.name} icon={scene.icon} />
      ))}
    </>
  )
}
