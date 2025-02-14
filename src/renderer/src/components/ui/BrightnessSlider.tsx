import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'

export default function BrightnessSlider() {
  const bulb = useBulbStore((state) => state.bulb)
  const setBrightness = useBulbStore((state) => state.setBrightness)

  const [isDragging, setIsDragging] = useState(false)
  const [currentBrightness, setCurrentBrightness] = useState(bulb.dimming)

  const handleMouseUp = () => {
    if (isDragging && currentBrightness) {
      setBrightness(currentBrightness)
      setIsDragging(false)
    }
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleChangeBrightness = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentBrightness(parseInt(event.target.value))
  }

  return (
    <div>
      <label className="text-xs text-neutral-400/75 subpixel-antialiased">
        Brightness: {currentBrightness}%
      </label>
      <input
        aria-label="Brightness control"
        type="range"
        min={0}
        max={100}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        onChange={handleChangeBrightness}
        defaultValue={currentBrightness}
        step={10}
        className="w-full"
        role="slider"
      />
    </div>
  )
}
