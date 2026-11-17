import { cn } from '@renderer/lib/cn'
import { LuLoaderCircle } from 'react-icons/lu'

type SpinnerProps = { size?: number; className?: string }

/** Decorative: pair it with visible text that says what is loading. */
export default function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <LuLoaderCircle
      size={size}
      aria-hidden
      className={cn('animate-spin motion-reduce:animate-none', className)}
    />
  )
}
