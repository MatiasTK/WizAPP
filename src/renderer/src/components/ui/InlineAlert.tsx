import { cn } from '@renderer/lib/cn'
import type { ReactNode } from 'react'
import { LuBell, LuCheck, LuCircleAlert, LuTriangleAlert } from 'react-icons/lu'

type Tone = 'info' | 'success' | 'warning' | 'danger'

type InlineAlertProps = {
  tone?: Tone
  children: ReactNode
  /** A button or link shown at the end of the alert. */
  action?: ReactNode
  className?: string
}

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-primary-soft border-primary', icon: <LuBell size={16} /> },
  success: { box: 'bg-success-soft border-success', icon: <LuCheck size={16} /> },
  warning: { box: 'bg-warning-soft border-warning', icon: <LuTriangleAlert size={16} /> },
  danger: { box: 'bg-danger-soft border-danger', icon: <LuCircleAlert size={16} /> }
}

export default function InlineAlert({
  tone = 'info',
  children,
  action,
  className
}: InlineAlertProps) {
  const { box, icon } = tones[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-3 rounded-md border px-4 py-3 text-fg',
        box,
        className
      )}
    >
      <span aria-hidden className="shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1 basis-56">{children}</div>
      {action && <div className="shrink-0 pl-7">{action}</div>}
    </div>
  )
}
