import { LuPower } from 'react-icons/lu'

type PowerButtonProps = {
  size?: number
  isOn: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function PowerButton({ size = 20, isOn, onToggle, disabled = false }: PowerButtonProps) {
  const handleToggleBulb = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click from triggering
    if (disabled) return
    onToggle()
  }

  return (
    <button
      type="button"
      tabIndex={0}
      aria-label="Toggle bulb"
      disabled={disabled}
      className={`bg-neutral-300 text-primary p-1.5 rounded-full transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-40' : `cursor-pointer hover:text-white ${isOn ? 'hover:bg-alert' : 'hover:bg-lime-600'}`}`}
      onClick={handleToggleBulb}
    >
      <LuPower strokeWidth={3} size={size} />
    </button>
  )
}
