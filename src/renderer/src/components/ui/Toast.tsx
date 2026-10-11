import Button from '@components/ui/Button'
import IconButton from '@components/ui/IconButton'
import { useBulbStore, type AppToast } from '@renderer/context/BulbStore'
import { cn } from '@renderer/lib/cn'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu'

const AUTO_DISMISS_MS = 6000

const ACTION_LABELS = {
  'retry-discovery': 'toast.retry',
  'install-update': 'toast.updateNow',
  'open-apps-settings': 'toast.openSettings'
} as const

const TONES = {
  success: {
    icon: <LuCircleCheck size={18} />,
    color: 'text-success-text',
    edge: 'border-l-success'
  },
  error: { icon: <LuCircleAlert size={18} />, color: 'text-danger-text', edge: 'border-l-danger' },
  info: { icon: <LuInfo size={18} />, color: 'text-primary-text', edge: 'border-l-primary' }
} as const

function Toast({ toast }: { toast: AppToast }) {
  const { t } = useTranslation()
  const dismissToast = useBulbStore((s) => s.dismissToast)
  const retryDiscovery = useBulbStore((s) => s.retryDiscovery)
  const installUpdate = useBulbStore((s) => s.installUpdate)
  const openAppsSettings = useBulbStore((s) => s.openAppsSettings)
  const [paused, setPaused] = useState(false)
  const remaining = useRef(AUTO_DISMISS_MS)

  // Auto-dismiss is paused while the pointer or the focus is on the toast.
  useEffect(() => {
    if (!toast.autoDismiss || paused) return undefined
    const startedAt = Date.now()
    const timer = window.setTimeout(() => dismissToast(toast.id), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt))
    }
  }, [toast.id, toast.autoDismiss, paused, dismissToast])

  const tone = TONES[toast.type]

  const handleAction = () => {
    dismissToast(toast.id)
    if (toast.retryAction === 'retry-discovery') void retryDiscovery()
    if (toast.retryAction === 'install-update') void installUpdate()
    if (toast.retryAction === 'open-apps-settings') void openAppsSettings()
  }

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-96 items-start gap-3 rounded-lg border-l-4 bg-sidebar p-4 text-fg shadow-xl',
        tone.edge
      )}
    >
      <span aria-hidden className={cn('mt-0.5 shrink-0', tone.color)}>
        {tone.icon}
      </span>
      <div className="flex min-w-0 grow flex-col gap-2">
        <p className="text-sm">{t(toast.message, toast.params)}</p>
        {toast.retryAction && (
          <Button size="dense" variant="secondary" className="w-fit" onClick={handleAction}>
            {t(ACTION_LABELS[toast.retryAction])}
          </Button>
        )}
      </div>
      <IconButton
        label={t('common.close')}
        tooltip={false}
        onClick={() => dismissToast(toast.id)}
        className="-mt-1 -mr-1"
      >
        <LuX size={14} aria-hidden />
      </IconButton>
    </div>
  )
}

export function ToastContainer() {
  const { t } = useTranslation()
  const toasts = useBulbStore((s) => s.toasts)
  return createPortal(
    <div
      role="region"
      // Live regions are not hidden from assistive technology when a modal opens,
      // so toasts stay announced above dialogs.
      aria-live="polite"
      aria-label={t('toast.region')}
      className="pointer-events-none fixed right-4 bottom-4 z-(--z-toast) flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  )
}
