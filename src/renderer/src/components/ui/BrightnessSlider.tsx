import Slider from '@components/ui/Slider'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const MIN_BRIGHTNESS = 10
export const MAX_BRIGHTNESS = 100
const KEYBOARD_PAUSE_MS = 200

type BrightnessSliderProps = {
  ip: string
  dimming?: number
  disabled?: boolean
  /** Bulb name, for the accessible name. */
  name: string
  showValue?: boolean
}

/**
 * Brightness of one bulb. The value is sent when the thumb is released, or shortly
 * after the last key press, never on every intermediate step.
 */
export default function BrightnessSlider({
  ip,
  dimming,
  disabled,
  name,
  showValue = true
}: BrightnessSliderProps) {
  const { t } = useTranslation()
  const setBrightness = useBulbStore((s) => s.setBrightness)
  const [value, setValue] = useState(dimming ?? 50)
  const editing = useRef(false)
  const timer = useRef<number>(undefined)

  // Follow the bulb unless the user is in the middle of changing it.
  useEffect(() => {
    if (!editing.current) setValue(dimming ?? 50)
  }, [dimming, ip])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handleChange = (next: number) => {
    editing.current = true
    setValue(next)
  }

  const handleCommit = (next: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      editing.current = false
      void setBrightness(next, ip)
    }, KEYBOARD_PAUSE_MS)
  }

  return (
    <div className="flex items-center gap-2">
      <Slider
        aria-label={t('bulb.brightness', { name })}
        value={value}
        min={MIN_BRIGHTNESS}
        max={MAX_BRIGHTNESS}
        step={10}
        disabled={disabled}
        onValueChange={handleChange}
        onValueCommit={handleCommit}
      />
      {showValue && (
        <span aria-hidden className="w-9 shrink-0 text-right text-xs text-muted tabular-nums">
          {value}%
        </span>
      )}
    </div>
  )
}
