import * as RadixSelect from '@radix-ui/react-select'
import { cn, focusRing } from '@renderer/lib/cn'
import { LuCheck, LuChevronDown } from 'react-icons/lu'

/** `shortLabel` is what the closed select shows; the list uses `label`. */
export type SelectOption = { value: string; label: string; shortLabel?: string }

type SelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  'aria-label'?: string
  'aria-labelledby'?: string
  id?: string
  disabled?: boolean
  className?: string
  /** `ghost` has no fill until hovered; used inside cards. */
  variant?: 'field' | 'ghost'
}

export default function Select({
  value,
  onValueChange,
  options,
  disabled,
  className,
  variant = 'field',
  id,
  ...aria
}: SelectProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        id={id}
        {...aria}
        className={cn(
          'inline-flex h-10 min-w-36 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3.5 text-sm text-fg transition-colors',
          variant === 'field'
            ? 'border-transparent bg-raised hover:border-control'
            : 'border-transparent bg-transparent hover:bg-raised',
          'disabled:cursor-not-allowed disabled:opacity-50',
          focusRing,
          'focus-visible:border-transparent focus-visible:ring-offset-0',
          className
        )}
      >
        <span className="min-w-0 truncate text-left">
          <RadixSelect.Value>{selected?.shortLabel ?? selected?.label}</RadixSelect.Value>
        </span>
        <RadixSelect.Icon>
          <LuChevronDown size={16} aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-(--z-menu) min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-xl"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="relative flex h-9 cursor-pointer items-center rounded-md pr-3 pl-8 text-sm text-fg outline-none data-highlighted:bg-raised"
              >
                <RadixSelect.ItemIndicator className="absolute left-2.5">
                  <LuCheck size={14} aria-hidden />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
