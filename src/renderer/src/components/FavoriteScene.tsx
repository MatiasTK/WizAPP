import { useBulbStore } from '@renderer/context/BulbStore'
import { scenes } from 'src/renderer/utils/scenesInfo'
import SceneItem from './SceneItem'

export default function FavoriteScene() {
  const bulb = useBulbStore((state) => state.bulb)

  const filteredFavorites = bulb
    ? scenes.filter((scene) => bulb.favoriteColors.includes(scene.id))
    : []
  const filteredCustomColors = bulb
    ? bulb.customColors.filter((color) => bulb.favoriteColors.includes(color.id))
    : []

  return (
    <>
      <h2 className="text-2xl font-semibold">Favorites</h2>
      {bulb && bulb.favoriteColors.length > 0 ? (
        <article className="mt-8 w-full grid grid-cols-3 gap-x-4 gap-y-4 lg:gap-y-6 lg:grid-cols-4 xl:grid-cols-5">
          {filteredFavorites.map((color) => (
            <SceneItem id={color.id} name={color.name} icon={color.icon} key={color.id} />
          ))}
          {filteredCustomColors.map((color) => (
            <SceneItem
              id={color.id}
              name={color.name}
              icon={
                <span className="h-6 w-6 rounded-full" style={{ backgroundColor: color.hex }} />
              }
              key={color.id}
            />
          ))}
        </article>
      ) : (
        <p className="my-12 text-center text-neutral-500 font-bold text-sm">
          You haven&apos;t selected any favorite scene yet, try selecting one
        </p>
      )}
    </>
  )
}
