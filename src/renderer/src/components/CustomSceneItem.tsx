import { LuHeart, LuSquarePen, LuTrash } from 'react-icons/lu'
import KebabMenu from './ui/KebabMenu'

type CustomSceneItemProps = {
  name: string
  active: boolean
  color: string
  onClick: () => void
  onFavorite: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CustomSceneItem({
  name,
  active,
  color,
  onClick,
  onFavorite,
  onEdit,
  onDelete
}: CustomSceneItemProps) {
  const items = [
    {
      label: 'Add to favorites',
      icon: <LuHeart size={20} />,
      onClick: onFavorite
    },
    {
      label: 'Edit',
      icon: <LuSquarePen size={20} />,
      onClick: onEdit
    },
    {
      label: 'Delete',
      icon: <LuTrash size={20} />,
      onClick: onDelete
    }
  ]

  return (
    <button
      className={`flex items-center justify-between cursor-pointer ${active ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'} text-white rounded-2xl px-4 py-6 2xl:px-6 text-nowrap transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-white ms-2 font-medium text-sm lg:text-base">{name}</span>
      </div>
      <KebabMenu items={items} />
    </button>
  )
}
