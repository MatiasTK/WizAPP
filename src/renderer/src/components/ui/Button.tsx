import { cn, focusRing } from '@renderer/lib/cn'
import type { ComponentProps } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger-soft'
export type ButtonSize = 'dense' | 'normal' | 'large'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border-outline bg-surface text-fg hover:bg-raised',
  ghost: 'border-transparent bg-transparent text-fg hover:bg-raised',
  destructive: 'border-transparent bg-danger text-on-danger hover:bg-danger-hover',
  // A delete action that leads to a confirmation, not the confirmation itself.
  'danger-soft': 'border-danger-outline bg-danger-soft text-danger-text hover:border-danger-text'
}

// `large` is for the action row of a dialog.
const sizes: Record<ButtonSize, string> = {
  dense: 'h-8 gap-1.5 rounded-sm px-3 text-[13px]',
  normal: 'h-9 gap-2 rounded-[9px] px-3.5 text-sm',
  large: 'h-[38px] gap-2 rounded-[9px] px-4 text-sm'
}

export const buttonClasses = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'normal') =>
  cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center border font-semibold whitespace-nowrap transition-colors',
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
