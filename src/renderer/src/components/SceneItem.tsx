import { LuHeart } from 'react-icons/lu'

type SceneItemProps = {
  name: string
  active: boolean
  icon: React.ReactNode
  onClick: () => void
}

export default function SceneItem({ name, active, icon, onClick }: SceneItemProps) {
  return (
    <button
      className={`flex items-center justify-between cursor-pointer ${active ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'} text-white rounded-2xl px-4 py-6 2xl:px-6 text-nowrap transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon}
        <span className="text-white ms-2 font-medium text-sm lg:text-base">{name}</span>
      </div>
      <button className="text-neutral-300 cursor-pointer hover:text-alert ms-2">
        <LuHeart size={20} />
      </button>
    </button>
  )
}
