import * as RadixSlider from '@radix-ui/react-slider'
import { cn, focusRing } from '@renderer/lib/cn'
import { ACCENT, accentStyle } from '@renderer/lib/light'

type SliderProps = {
  value: number
  onValueChange: (value: number) => void
  /** Fired when the user releases the thumb or presses a key. */
  onValueCommit?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Fill color (the bulb's own color); the primary color when omitted. */
  rangeColor?: string
  /** Grey fill: a value with no light behind it (a switched-off bulb). */
  neutral?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  /** Spoken value, e.g. "80 %" instead of a bare "80". */
  valueText?: string
  className?: string
}

export default function Slider({
  value,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  rangeColor,
  neutral,
  valueText,
  className,
  ...aria
}: SliderProps) {
  return (
    <RadixSlider.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={([v]) => onValueChange(v)}
      onValueCommit={([v]) => onValueCommit?.(v)}
      className={cn(
        'relative flex h-5 w-full touch-none items-center select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <RadixSlider.Track className="relative h-2 grow cursor-pointer rounded-full bg-track data-disabled:cursor-not-allowed">
        <RadixSlider.Range
          className={cn(
            'absolute h-full rounded-full transition-colors duration-300',
            rangeColor ? cn(ACCENT, 'bg-(--accent)') : neutral ? 'bg-control' : 'bg-primary'
          )}
          // A pale bulb color (white, daylight) is darkened until it reads on the track.
          style={rangeColor ? accentStyle(rangeColor) : undefined}
        />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        {...aria}
        aria-valuetext={valueText}
        className={cn(
          'block size-5 cursor-pointer rounded-full bg-knob shadow-[0_0_0_1px_rgb(0_0_0/0.14),0_2px_6px_rgb(0_0_0/0.28)]',
          'data-disabled:cursor-not-allowed',
          focusRing
        )}
      />
    </RadixSlider.Root>
  )
}
