import Tooltip from '@components/ui/Tooltip'
import { cn, focusRing } from '@renderer/lib/cn'
import type { ComponentProps } from 'react'

type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label'> & {
  /** Accessible name; also shown as a tooltip. */
  label: string
  tone?: 'neutral' | 'danger'
  tooltip?: boolean
}

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
        'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger'
          ? 'text-danger-text hover:bg-danger-soft'
          : 'text-muted hover:bg-raised hover:text-fg',
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
