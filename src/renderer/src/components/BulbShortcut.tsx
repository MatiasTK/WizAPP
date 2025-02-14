import { useBulbStore } from '@renderer/context/BulbStore'
import BrightnessSlider from './ui/BrightnessSlider'
import PowerButton from './ui/PowerButton'

export default function BulbShortcut() {
  const bulb = useBulbStore((state) => state.bulb)

  return (
    <div className="text-white px-4 py-2 bg-secondary rounded-xl animate-steps-modern animate-pulse-fade-in">
      <div className="flex justify-between items-center">
        <p>{bulb.name}</p>
        <PowerButton />
      </div>
      <BrightnessSlider />
    </div>
  )
}
