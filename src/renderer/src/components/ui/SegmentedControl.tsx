import { cn, focusRing } from '@renderer/lib/cn'

export type Segment<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  value: T
  onValueChange: (value: T) => void
  segments: Segment<T>[]
  'aria-label': string
  className?: string
}

/** One-of-N choice shown as a single capsule; the selected segment is filled. */
export default function SegmentedControl<T extends string>({
  value,
  onValueChange,
  segments,
  className,
  'aria-label': ariaLabel
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-raised p-1', className)}
    >
      {segments.map((segment) => {
        const selected = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onValueChange(segment.value)}
            className={cn(
              'h-8 shrink-0 cursor-pointer rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
              selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-fg',
              focusRing
            )}
          >
            {segment.label}
          </button>
        )
      })}
    </div>
  )
}
