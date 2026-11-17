import Slider from '@components/ui/Slider'
import { useBulbStore } from '@renderer/context/BulbStore'
import { cn, focusRing } from '@renderer/lib/cn'
import { ACCENT, accentStyle } from '@renderer/lib/light'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuSun } from 'react-icons/lu'

export const MIN_BRIGHTNESS = 10
export const MAX_BRIGHTNESS = 100
const PRESETS = [25, 50, 75, 100]
const KEYBOARD_PAUSE_MS = 200

type BrightnessSliderProps = {
  ip: string
  dimming?: number
  disabled?: boolean
  /** Bulb name, for the accessible name. */
  name: string
  /** 25/50/75/100 % buttons under the slider (open bulb cards). */
  presets?: boolean
  /** `sm` for the sidebar card. */
  size?: 'sm' | 'md'
  /** Color of the filled track: the bulb's own color while it is lit. */
  color?: string | null
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
  presets = false,
  size = 'md',
  color
}: BrightnessSliderProps) {
  const { t } = useTranslation()
  const setBrightness = useBulbStore((s) => s.setBrightness)
  const [value, setValue] = useState(dimming ?? 50)
  const editing = useRef(false)
  const hintId = useId()
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

  const handlePreset = (next: number) => {
    window.clearTimeout(timer.current)
    editing.current = false
    setValue(next)
    void setBrightness(next, ip)
  }

  return (
    <div
      className={cn('flex flex-col', size === 'sm' ? 'gap-2' : 'gap-2.5', color && ACCENT)}
      style={color ? accentStyle(color) : undefined}
    >
      <div
        className={cn(
          'flex items-center gap-2 text-muted',
          size === 'sm' ? 'gap-1.5 text-[13px]' : 'text-sm'
        )}
      >
        <LuSun size={size === 'sm' ? 14 : 16} aria-hidden />
        <span aria-hidden className="grow">
          {t('bulb.brightnessLabel')}
        </span>
        <span aria-hidden className="font-bold text-fg tabular-nums">
          {t('common.percent', { value })}
        </span>
      </div>
      <Slider
        aria-label={t('bulb.brightness', { name })}
        aria-describedby={disabled ? hintId : undefined}
        value={value}
        min={MIN_BRIGHTNESS}
        max={MAX_BRIGHTNESS}
        step={5}
        disabled={disabled}
        rangeColor={color ?? undefined}
        neutral={!color}
        valueText={t('common.percent', { value })}
        onValueChange={handleChange}
        onValueCommit={handleCommit}
      />
      {disabled && (
        <p id={hintId} className="text-xs text-muted">
          {t('bulb.brightnessOff')}
        </p>
      )}
      {presets && (
        <div className="flex gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={value === preset}
              disabled={disabled}
              onClick={() => handlePreset(preset)}
              aria-label={t('bulb.brightnessPreset', { name, value: preset })}
              className={cn(
                'h-[30px] flex-1 cursor-pointer rounded-sm border text-xs font-semibold transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                value === preset
                  ? color
                    ? 'border-(--accent) bg-[color-mix(in_srgb,var(--accent)_14%,var(--color-surface))] text-fg ring-1 ring-(--accent)'
                    : 'border-control bg-raised text-fg'
                  : 'border-outline bg-surface text-fg hover:bg-raised',
                focusRing
              )}
            >
              {t('common.percent', { value: preset })}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
