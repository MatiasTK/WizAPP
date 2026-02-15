import { useBulbStore } from '@renderer/context/BulbStore'
import { LuHeart } from 'react-icons/lu'

type SceneItemProps = {
  id: number
  name: string
  icon: React.ElementType
}

export default function SceneItem({ id, name, icon }: SceneItemProps) {
  const bulb = useBulbStore((state) => state.activeBulb)
  const setScene = useBulbStore((state) => state.setScene)
  const toggleFavoriteColor = useBulbStore((state) => state.toggleFavoriteColor)

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
  const Icon = icon

  return (
    <div
      className={`flex items-center justify-between cursor-pointer ${active ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'} text-white rounded-2xl px-4 py-6 2xl:px-6 text-nowrap transition-colors ${!bulb ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center">
        <Icon size={24} />
        <span className="text-white ms-2 font-medium text-sm lg:text-base">{name}</span>
      </div>
      <button
        className={` cursor-pointer ms-2 ${isFavorite ? 'text-alert hover:text-neutral-300' : 'text-neutral-300 hover:text-alert'} transition-colors duration-300 disabled:cursor-not-allowed`}
        disabled={!bulb}
        onClick={handleAddFavorite}
      >
        <LuHeart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
