import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LuX } from 'react-icons/lu'

type modalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  maxWidth?: string
  showCloseButton?: boolean
}

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 'max-w-lg',
  showCloseButton = true
}: modalProps) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 transition-opacity " onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative z-50 ${maxWidth} w-full bg-secondary-800 text-white rounded-xl shadow-xl animate-steps-modern animate-fade-in-down animate-duration-fast px-2 py-1`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-full transition-colors text-neutral-500 hover:text-neutral-300 cursor-pointer"
            >
              <LuX size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
