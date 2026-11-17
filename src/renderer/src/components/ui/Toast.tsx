import { useBulbStore, type AppToast } from '@renderer/context/BulbStore'
import { cn, focusRing } from '@renderer/lib/cn'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { LuBell, LuCheck, LuCircleAlert, LuX } from 'react-icons/lu'

const AUTO_DISMISS_MS = 6000

const ACTION_LABELS = {
  'retry-discovery': 'toast.retry',
  'install-update': 'toast.updateNow',
  'open-apps-settings': 'toast.openSettings'
} as const

const ICONS = {
  success: <LuCheck size={16} strokeWidth={2.4} />,
  error: <LuCircleAlert size={16} />,
  info: <LuBell size={16} />
} as const

// A pill in the inverse colors (dark in light mode, light in dark mode).
const pillButton = cn(
  'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-on-toast/15',
  focusRing
)

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

  // The toast goes away with the button that has the focus; the page heading takes it.
  const keepFocus = () =>
    (toast.origin?.isConnected
      ? toast.origin
      : document.querySelector<HTMLElement>('main h1')
    )?.focus({ preventScroll: true })

  const handleUndo = () => {
    keepFocus()
    dismissToast(toast.id)
    toast.undo?.()
  }

  const handleClose = () => {
    if (document.activeElement?.closest('[role="region"]')) keepFocus()
    dismissToast(toast.id)
  }

  const handleAction = () => {
    keepFocus()
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
      className="pointer-events-auto flex max-w-[min(560px,calc(100vw-2rem))] items-center gap-2.5 rounded-[12px] bg-toast py-2 pr-2 pl-4 font-medium text-on-toast shadow-[0_10px_30px_rgb(0_0_0/0.25)]"
    >
      <span aria-hidden className="shrink-0">
        {ICONS[toast.type]}
      </span>
      <p className="min-w-0 grow py-1">{t(toast.message, toast.params)}</p>
      {toast.undo && (
        <button
          type="button"
          onClick={handleUndo}
          className={cn(pillButton, 'border border-on-toast/40 px-2.5 text-[13px] font-semibold')}
        >
          {t('common.undo')}
        </button>
      )}
      {toast.retryAction && (
        <button
          type="button"
          onClick={handleAction}
          className={cn(pillButton, 'border border-on-toast/40 px-2.5 text-[13px] font-semibold')}
        >
          {t(ACTION_LABELS[toast.retryAction])}
        </button>
      )}
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={handleClose}
        className={cn(pillButton, 'w-7 opacity-80 hover:opacity-100')}
      >
        <LuX size={14} aria-hidden />
      </button>
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
      className="pointer-events-none fixed right-0 bottom-5 left-56 z-(--z-toast) flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  )
}
