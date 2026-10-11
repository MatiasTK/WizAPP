import KebabMenu from '@components/ui/KebabMenu'
import { useBulbStore } from '@renderer/context/BulbStore'
import { ReactNode } from 'react'

type CustomSceneItemProps = {
  id: number
  name: string
  color: string
  kebabMenuOptions: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
  }>
}

export default function CustomSceneItem({
  id,
  name,
  color,
  kebabMenuOptions
}: CustomSceneItemProps) {
  const bulb = useBulbStore((state) => state.activeBulb)
  const setCustomColor = useBulbStore((state) => state.setCustomColor)

  const handleSetCustomColor = () => {
    setCustomColor(id)
  }

  const active = id === bulb.sceneId

  return (
    <div
      className={`flex items-center justify-between cursor-pointer ${active ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'} text-white rounded-2xl px-4 py-6 2xl:px-6 text-nowrap transition-colors`}
      onClick={handleSetCustomColor}
    >
      <div className="flex items-center">
        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-white ms-2 font-medium text-sm lg:text-base">{name}</span>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <KebabMenu items={kebabMenuOptions} />
      </div>
    </div>
  )
}
