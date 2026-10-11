import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBulbStore } from '@renderer/context/BulbStore'
import { IconType } from 'react-icons'
import { LuGripVertical, LuHeart } from 'react-icons/lu'

type SortableSceneItemProps = {
  id: number
  name: string
  icon?: IconType
  hex?: string
}

export default function SortableSceneItem({ id, name, icon, hex }: SortableSceneItemProps) {
  const bulb = useBulbStore((state) => state.activeBulb)
  const setScene = useBulbStore((state) => state.setScene)
  const toggleFavoriteColor = useBulbStore((state) => state.toggleFavoriteColor)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id
  })

  const Icon = icon as IconType

  const active = bulb ? bulb.sceneId === id : false

  const handleClick = () => {
    if (!bulb) return
    setScene(id)
  }

  const handleAddFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavoriteColor(id)
  }

  const isFavorite = bulb ? bulb.favoriteColors.includes(id) : false

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      onClick={handleClick}
      className={`flex items-center ${active ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'} text-white rounded-2xl pr-4 py-6 text-nowrap transition-colors ${!bulb ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="px-2 text-neutral-300 relative">
        <div
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab absolute inset-0 -inset-y-5"
        />
        <LuGripVertical size={20} className="relative pointer-events-none" />
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {icon ? (
            <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
          ) : (
            <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full" style={{ backgroundColor: hex }} />
          )}
          <span className="text-white font-medium text-sm lg:text-md ms-1 lg:ms-2 tracking-tighter lg:tracking-normal">
            {name}
          </span>
        </div>
        <button
          className={` cursor-pointer ms-1 lg:ms-2 ${isFavorite ? 'text-alert hover:text-neutral-300' : 'text-neutral-300 hover:text-alert'} transition-colors duration-300 disabled:cursor-not-allowed`}
          disabled={!bulb}
          onClick={handleAddFavorite}
        >
          <LuHeart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  )
}
