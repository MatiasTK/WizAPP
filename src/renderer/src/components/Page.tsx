import { cn } from '@renderer/lib/cn'
import type { ReactNode } from 'react'

type PageProps = {
  title: string
  subtitle?: ReactNode
  /** Buttons on the right of the title. */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** Page frame: title, subtitle and actions, then the content. Only `main` scrolls. */
export default function Page({ title, subtitle, actions, children, className }: PageProps) {
  return (
    <div className={cn('flex flex-col gap-5 px-8 pt-7 pb-20', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}
