import { useBulbStore } from '@renderer/context/BulbStore'
import { LuHeart } from 'react-icons/lu'

type SceneItemProps = {
  id: number
  name: string
  icon: React.ReactNode
}

export default function SceneItem({ id, name, icon }: SceneItemProps) {
  const bulb = useBulbStore((state) => state.bulb)
  const setScene = useBulbStore((state) => state.setScene)
  const toggleFavoriteColor = useBulbStore((state) => state.toggleFavoriteColor)

  const active = bulb.sceneId === id

  const handleClick = () => {
    setScene(id)
  }

  const handleAddFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavoriteColor(id)
  }

  const isFavorite = bulb.favoriteColors.includes(id)

  return (
    <button
      className={`flex items-center justify-between cursor-pointer ${active ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'} text-white rounded-2xl px-4 py-6 2xl:px-6 text-nowrap transition-colors`}
      onClick={handleClick}
    >
      <div className="flex items-center">
        {icon}
        <span className="text-white ms-2 font-medium text-sm lg:text-base">{name}</span>
      </div>
      <button
        className={` cursor-pointer ms-2 ${isFavorite ? 'text-alert hover:text-neutral-300' : 'text-neutral-300 hover:text-alert'} transition-colors duration-300`}
        onClick={handleAddFavorite}
      >
        <LuHeart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </button>
  )
}
