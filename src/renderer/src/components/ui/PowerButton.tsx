import { LuPower } from 'react-icons/lu'

type PowerButtonProps = {
  size?: number
  isOn: boolean
  onToggle: () => void
}

export default function PowerButton({ size = 20, isOn, onToggle }: PowerButtonProps) {
  const handleToggleBulb = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click from triggering
    onToggle()
  }

  return (
    <button
      className={`hover:text-white bg-neutral-300 text-primary p-1.5 rounded-full cursor-pointer transition-all duration-300 ${isOn ? 'hover:bg-alert' : 'hover:bg-lime-600'}`}
      onClick={handleToggleBulb}
    >
      <LuPower strokeWidth={3} size={size} />
    </button>
  )
}
