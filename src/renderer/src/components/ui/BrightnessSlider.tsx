import { useBulbStore } from '@renderer/context/BulbStore'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function BrightnessSlider() {
  const { t } = useTranslation()
  const bulb = useBulbStore((state) => state.activeBulb)
  const setBrightness = useBulbStore((state) => state.setBrightness)

  const [isDragging, setIsDragging] = useState(false)
  const [currentBrightness, setCurrentBrightness] = useState(bulb?.dimming ?? 50)

  // Sync brightness when active bulb changes
  useEffect(() => {
    if (bulb) {
      setCurrentBrightness(bulb.dimming)
    }
  }, [bulb?.ip, bulb?.dimming])

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
    <div className="flex flex-col my-2 gap-2">
      <label className="text-xs text-neutral-400/75 subpixel-antialiased">
        {t('sidebar.brightness')}: {currentBrightness}%
      </label>
      <input
        aria-label="Brightness control"
        type="range"
        min={10}
        max={100}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        onChange={handleChangeBrightness}
        value={currentBrightness}
        step={10}
        className="w-full"
        role="slider"
      />
    </div>
  )
}
