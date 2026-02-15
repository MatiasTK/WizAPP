import BrightnessSlider from '@components/ui/BrightnessSlider'
import PowerButton from '@components/ui/PowerButton'
import { useBulbStore } from '@renderer/context/BulbStore'

export default function BulbShortcut() {
  const activeBulb = useBulbStore((state) => state.activeBulb)
  const toggleBulb = useBulbStore((state) => state.toggleBulb)

  if (!activeBulb) return null

  return (
    <div className="text-white px-4 py-2 bg-secondary rounded-xl animate-steps-modern animate-pulse-fade-in">
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col min-w-0 mr-2">
          <p className="font-medium overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {activeBulb.name}
          </p>
          <span className="text-xs text-neutral-400 font-bold">
            {activeBulb.state ? 'On' : 'Off'}
          </span>
        </div>
        <PowerButton isOn={activeBulb.state} onToggle={toggleBulb} />
      </div>
      <BrightnessSlider />
    </div>
  )
}
