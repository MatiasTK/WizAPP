import Tooltip from '@components/ui/Tooltip'
import { cn, focusRing } from '@renderer/lib/cn'
import type { ComponentProps } from 'react'

type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label'> & {
  /** Accessible name; also shown as a tooltip. */
  label: string
  /** `outline` has a visible border (the up/down buttons of a sort list). */
  tone?: 'neutral' | 'danger' | 'outline'
  tooltip?: boolean
}

const tones = {
  neutral: 'border-transparent text-muted hover:bg-raised hover:text-fg',
  danger: 'border-transparent text-danger-text hover:bg-danger-soft',
  outline: 'border-outline bg-surface text-fg hover:bg-raised'
} as const

export default function IconButton({
  label,
  tone = 'neutral',
  tooltip = true,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-35',
        tones[tone],
        focusRing,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button
}
