import SceneTile from '@components/SceneTile'
import SortableSceneItem from '@components/SortableSceneItem'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { matches } from '@renderer/lib/search'
import { useTranslation } from 'react-i18next'

/** New favorites order after moving `activeId` to where `overId` is; `null` if nothing moves. */
export const reorderFavorites = (
  ids: number[],
  activeId: number,
  overId: number
): number[] | null => {
  const from = ids.indexOf(activeId)
  const to = ids.indexOf(overId)
  if (from < 0 || to < 0 || from === to) return null
  return arrayMove(ids, from, to)
}

type FavoriteSceneProps = {
  /** The bulb a favorite is applied to. */
  bulb: BulbState | null
  /** While filtering, favorites are shown but not reorderable. */
  query?: string
}

/** Favorites, reorderable with the mouse or with the keyboard (handle + arrow keys). */
export default function FavoriteScene({ bulb, query = '' }: FavoriteSceneProps) {
  const { t } = useTranslation()
  const { favorites } = useCatalog()
  const setScene = useBulbStore((s) => s.setScene)
  const toggleFavoriteColor = useBulbStore((s) => s.toggleFavoriteColor)
  const setFavoriteColorsOrder = useBulbStore((s) => s.setFavoriteColorsOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const order = reorderFavorites(
      favorites.map((f) => f.id),
      Number(active.id),
      Number(over.id)
    )
    if (order) void setFavoriteColorsOrder(order)
  }

  if (favorites.length === 0) {
    return query ? null : <p className="text-sm text-muted">{t('scenes.missingFavorites')}</p>
  }

  if (query.trim() !== '') {
    const shown = favorites.filter((f) => matches(f.name, query))
    if (shown.length === 0) return null
    return (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
        {shown.map((entry) => (
          <li key={entry.id} className="min-w-0">
            <SceneTile
              entry={entry}
              active={bulb?.sceneId === entry.id}
              disabled={!bulb?.online}
              favorite
              onApply={() => void setScene(entry.id, bulb?.ip)}
              onToggleFavorite={() => void toggleFavoriteColor(entry.id)}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: { draggable: t('scenes.favorite.dragInstructions') }
      }}
    >
      <SortableContext items={favorites.map((f) => f.id)} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
          {favorites.map((entry) => (
            <SortableSceneItem
              key={entry.id}
              entry={entry}
              active={bulb?.sceneId === entry.id}
              disabled={!bulb?.online}
              favorite
              onApply={() => void setScene(entry.id, bulb?.ip)}
              onToggleFavorite={() => void toggleFavoriteColor(entry.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
