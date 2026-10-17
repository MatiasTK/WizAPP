import { cn, focusRing } from '@renderer/lib/cn'

export type Segment<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  value: T
  onValueChange: (value: T) => void
  segments: Segment<T>[]
  'aria-label'?: string
  'aria-labelledby'?: string
  /** Segments share the full width (settings) instead of hugging their label. */
  fill?: boolean
  className?: string
}

/** One-of-N choice in a sunken capsule; the selected segment is raised. */
export default function SegmentedControl<T extends string>({
  value,
  onValueChange,
  segments,
  fill,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      {...aria}
      className={cn(
        'flex max-w-full flex-wrap gap-0.5 rounded-md border border-border bg-sunken p-[3px]',
        !fill && 'w-fit',
        className
      )}
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
              'h-[30px] shrink-0 cursor-pointer rounded-[7px] px-3 text-[13px] font-semibold whitespace-nowrap transition-colors',
              fill && 'h-8 flex-1',
              selected
                ? 'bg-segment text-fg shadow-[0_1px_2px_rgb(0_0_0/0.12)] dark:shadow-none'
                : 'text-muted hover:text-fg',
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
