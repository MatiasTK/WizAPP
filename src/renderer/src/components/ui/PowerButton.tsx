import { useBulbStore } from '@renderer/context/BulbStore'
import { LuPower } from 'react-icons/lu'

export default function PowerButton() {
  const bulb = useBulbStore((state) => state.bulb)
  const toggleBulb = useBulbStore((state) => state.toggleBulb)

  const handleToggleBulb = () => {
    toggleBulb()
  }

  return (
    <button
      className={`hover:text-white bg-neutral-300 text-primary p-1.5 rounded-full cursor-pointer transition-all duration-300 ${bulb.state ? 'hover:bg-alert' : 'hover:bg-lime-600'}`}
      onClick={handleToggleBulb}
    >
      <LuPower size={20} strokeWidth={3} />
    </button>
  )
}
