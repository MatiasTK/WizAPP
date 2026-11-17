import { useState, type FocusEvent, type MouseEvent } from 'react'

type Handlers<E> = {
  onFocus?: (event: FocusEvent<E>) => void
  onBlur?: (event: FocusEvent<E>) => void
  onClick?: (event: MouseEvent<E>) => void
}

/**
 * A button that becomes disabled while it has the focus ("Turn all off" once everything is off,
 * "Retry" while it runs) would drop the focus to <body>. While focused it is only
 * `aria-disabled` and ignores clicks; once the focus leaves it is really `disabled`.
 */
export const useSoftDisabled = <E extends HTMLElement>(
  disabled: boolean | undefined,
  { onFocus, onBlur, onClick }: Handlers<E>
) => {
  const [focused, setFocused] = useState(false)
  return {
    disabled: disabled && !focused,
    'aria-disabled': disabled || undefined,
    onFocus: (event: FocusEvent<E>) => {
      setFocused(true)
      onFocus?.(event)
    },
    onBlur: (event: FocusEvent<E>) => {
      setFocused(false)
      onBlur?.(event)
    },
    onClick: (event: MouseEvent<E>) => {
      if (disabled) return event.preventDefault()
      onClick?.(event)
    }
  }
}
