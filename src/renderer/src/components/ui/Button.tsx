import { cn, focusRing } from '@renderer/lib/cn'
import type { ComponentProps } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'chip'
export type ButtonSize = 'dense' | 'normal'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-raised text-fg hover:bg-border',
  ghost: 'bg-transparent text-fg hover:bg-raised',
  destructive: 'bg-danger text-on-danger hover:bg-danger-hover',
  // A toggleable pill: `aria-pressed` marks the selected one.
  chip: 'bg-raised text-fg hover:bg-border aria-pressed:bg-primary aria-pressed:text-on-primary'
}

const sizes: Record<ButtonSize, string> = {
  dense: 'h-8 gap-1.5 px-3 text-sm',
  normal: 'h-10 gap-2 px-5 text-sm'
}

export const buttonClasses = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'normal') =>
  cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    focusRing,
    variants[variant],
    sizes[size]
  )

export default function Button({
  variant = 'secondary',
  size = 'normal',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return <button type={type} className={cn(buttonClasses(variant, size), className)} {...rest} />
}
