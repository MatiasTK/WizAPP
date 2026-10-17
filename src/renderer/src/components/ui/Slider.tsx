import * as RadixSlider from '@radix-ui/react-slider'
import { cn, focusRing } from '@renderer/lib/cn'

type SliderProps = {
  value: number
  onValueChange: (value: number) => void
  /** Fired when the user releases the thumb or presses a key. */
  onValueCommit?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
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
      <RadixSlider.Track className="relative h-2 grow cursor-pointer rounded-full bg-track">
        <RadixSlider.Range className="absolute h-full rounded-full bg-primary" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        {...aria}
        className={cn(
          'block size-5 cursor-pointer rounded-full bg-knob shadow-[0_0_0_1px_rgb(0_0_0/0.14),0_2px_6px_rgb(0_0_0/0.28)]',
          'disabled:cursor-not-allowed',
          focusRing
        )}
      />
    </RadixSlider.Root>
  )
}
