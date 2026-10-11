import { cn, focusRing } from '@renderer/lib/cn'
import { useId, type ComponentProps, type ReactNode } from 'react'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  /** Error shown under the field, linked with `aria-describedby`. */
  error?: string | null
  hint?: string
  id?: string
  /** Decorative icon at the start of the field (a search glass, for instance). */
  icon?: ReactNode
  /** Keeps the label for assistive technology only. */
  hideLabel?: boolean
  /** Classes for the wrapper (width in a toolbar, for instance). */
  wrapperClassName?: string
}

export default function TextField({
  label,
  error,
  hint,
  id,
  icon,
  hideLabel,
  wrapperClassName,
  className,
  ...rest
}: TextFieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-2', wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={cn('text-sm font-medium text-fg', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-raised px-3.5 text-sm text-fg placeholder:text-muted',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error ? 'border-danger-text' : 'border-transparent hover:border-control',
            focusRing,
            // One outline only: the ring replaces the border while focused.
            'focus-visible:border-transparent focus-visible:ring-offset-0',
            className
          )}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
