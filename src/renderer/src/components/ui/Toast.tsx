import { useBulbStore } from '@renderer/context/BulbStore'
import { ToastMessage } from '@shared/types/toastMessage'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu'

const AUTO_DISMISS_MS = 5000

function Toast({ toast }: { toast: ToastMessage }) {
  const { t } = useTranslation()
  const dismissToast = useBulbStore((s) => s.dismissToast)
  const retryDiscovery = useBulbStore((s) => s.retryDiscovery)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (toast.autoDismiss) {
      const timer = setTimeout(() => handleDismiss(), AUTO_DISMISS_MS)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [toast.id, toast.autoDismiss])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => dismissToast(toast.id), 300) // Wait for exit animation
  }

  const styles = {
    success: {
      icon: <LuCircleCheck className="h-5 w-5" />,
      sidebar: 'bg-green-500',
      iconColor: 'text-green-500'
    },
    error: {
      icon: <LuCircleAlert className="h-5 w-5" />,
      sidebar: 'bg-red-500',
      iconColor: 'text-red-500'
    },
    info: {
      icon: <LuInfo className="h-5 w-5" />,
      sidebar: 'bg-blue-500',
      iconColor: 'text-blue-500'
    }
  }[toast.type]

  return (
    <div
      className={`
        relative flex w-full min-w-[320px] max-w-[400px] overflow-hidden rounded-xl
        bg-sidebar-bg shadow-xl shadow-black/20 ring-1 ring-white/10
        transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-slide-in-right'}
      `}
      role="alert"
    >
      {/* Colored sidebar indicator */}
      <div className={`w-1 shrink-0 ${styles.sidebar}`} />

      <div className="flex flex-1 items-start gap-3 p-4">
        <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>{styles.icon}</div>

        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-sm font-medium leading-snug text-gray-100">{t(toast.message)}</p>

          {toast.retryAction && (
            <button
              onClick={() => {
                handleDismiss()
                retryDiscovery()
              }}
              className="mt-1 w-fit rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 active:bg-white/25 cursor-pointer"
            >
              {t('toast.retry')}
            </button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="group -mr-1 -mt-1 p-1 text-gray-400 transition-colors hover:text-white cursor-pointer"
          aria-label="Close"
        >
          <LuX size={16} className="transition-transform group-hover:scale-110" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useBulbStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  )
}
