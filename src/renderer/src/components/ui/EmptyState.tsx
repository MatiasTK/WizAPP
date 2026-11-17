import { cn } from '@renderer/lib/cn'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actions,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-control bg-surface p-12 text-center',
        className
      )}
    >
      {icon && <div className="text-muted">{icon}</div>}
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      {description && <div className="max-w-md text-muted">{description}</div>}
      {actions && <div className="mt-3 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
