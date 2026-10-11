import Card from '@components/ui/Card'
import KebabMenu from '@components/ui/KebabMenu'
import PowerButton from '@components/ui/PowerButton'
import { BulbState } from '@shared/types/bulbState'
import { ReactNode, useState } from 'react'

type BulbCardProps = {
  bulb: BulbState
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
  menuItems: {
    icon: ReactNode
    label: string
    onClick: () => void
  }[]
}

export default function BulbCard({ bulb, isActive, onSelect, onToggle, menuItems }: BulbCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Card
      className={`w-full h-31 py-3 px-4 relative ${
        isActive
          ? 'shadow-[0_0_12px_rgba(55,114,255,0.4)] hover:brightness-110'
          : 'opacity-60 hover:opacity-90'
      } ${isMenuOpen ? 'z-50' : 'z-auto'}`}
      variant={bulb.state ? 'primary' : 'secondary'}
      active={isActive}
      onClick={onSelect}
    >
      <p className="text-lg overflow-hidden text-ellipsis whitespace-nowrap">{bulb.name}</p>
      <span className="text-neutral-300">{bulb.state ? 'on' : 'off'}</span>

      <div className="mt-4 flex justify-between items-center">
        <PowerButton isOn={bulb.state} onToggle={onToggle} />
        <KebabMenu items={menuItems} onOpenChange={setIsMenuOpen} />
      </div>
    </Card>
  )
}
