import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useBulbStore } from '@renderer/context/BulbStore'
import { CustomColor } from '@shared/types/customColor'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Scene, scenes } from 'src/renderer/utils/scenesInfo'
import SortableSceneItem from './SortableSceneItem'

export default function FavoriteScene() {
  const bulb = useBulbStore((state) => state.activeBulb)
  const { t } = useTranslation()
  const setFavoriteColorsOrder = useBulbStore((state) => state.setFavoriteColorsOrder)
  const sensors = useSensors(useSensor(PointerSensor))

  const favorites = useMemo(() => {
    if (!bulb) return []

    // Create a map of all available scenes and custom colors for quick lookup
    const scenesMap = new Map(scenes.map((scene) => [scene.id, scene]))
    const customColorsMap = new Map(bulb.customColors.map((color) => [color.id, color]))

    // Use bulb.favoriteColors order to create the final array
    return bulb.favoriteColors
      .map((id) => scenesMap.get(id) || customColorsMap.get(id))
      .filter((item): item is Scene | CustomColor => item !== undefined)
  }, [bulb?.favoriteColors])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((item) => item.id === active.id)
      const newIndex = favorites.findIndex((item) => item.id === over.id)
      const newFavorites = arrayMove(favorites, oldIndex, newIndex) as (Scene | CustomColor)[]
      setFavoriteColorsOrder(newFavorites.map((item) => item.id))
    }
  }

  return (
    <DndContext
      modifiers={[restrictToParentElement]}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <h2 className="text-2xl font-semibold">{t('scenes.favorites')}</h2>
      {bulb && bulb.favoriteColors.length > 0 ? (
        <SortableContext items={favorites} strategy={rectSortingStrategy}>
          <article className="mt-8 w-full grid grid-cols-3 gap-x-4 gap-y-4 lg:gap-y-6 lg:grid-cols-4 xl:grid-cols-5">
            {favorites.map((color) => {
              if ('hex' in color) {
                return (
                  <SortableSceneItem
                    id={color.id}
                    name={color.name}
                    hex={color.hex}
                    key={color.id}
                  />
                )
              }
              return (
                <SortableSceneItem
                  id={color.id}
                  name={t(`scenes.names.${color.name}`)}
                  icon={color.icon}
                  key={color.id}
                />
              )
            })}
          </article>
        </SortableContext>
      ) : (
        <p className="my-12 text-center text-neutral-500 font-bold text-sm">
          {t('scenes.missingFavorites')}
        </p>
      )}
    </DndContext>
  )
}
