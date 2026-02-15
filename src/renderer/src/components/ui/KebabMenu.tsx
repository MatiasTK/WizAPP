import { ReactNode, useEffect, useRef, useState } from 'react'
import { LuEllipsisVertical } from 'react-icons/lu'

type KebabMenuProps = {
  items: {
    label: string
    icon?: ReactNode
    onClick: () => void
  }[]
  onOpenChange?: (isOpen: boolean) => void
}

export default function KebabMenu({ items, onOpenChange }: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ right: false, bottom: false })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const menuRect = dropdownRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Check if menu goes off screen on the right
      const exceedsRight = buttonRect.left + menuRect.width > viewportWidth

      // Check if menu goes off screen on the bottom
      const exceedsBottom = buttonRect.bottom + menuRect.height > viewportHeight

      setMenuPosition({ right: exceedsRight, bottom: exceedsBottom })
    }
  }, [isOpen])

  const handleToggle = (e) => {
    e.stopPropagation()
    setIsOpen((prev) => !prev)
  }

  const handleClickItem = (e, item) => {
    e.stopPropagation()
    item.onClick()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        className="cursor-pointer text-neutral-300 hover:text-white transition-all duration-300 rounded-xl p-1"
        onClick={handleToggle}
      >
        <LuEllipsisVertical size={20} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute py-2 w-48 bg-secondary-700 rounded-md shadow-lg z-50 border border-secondary-500 transition-all animate-fade-in-down animate-steps-modern animate-duration-200
            ${menuPosition.right ? 'right-0' : 'left-0'}
            ${menuPosition.bottom ? 'bottom-5 mb-2' : 'top-5 mt-2'}`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => handleClickItem(e, item)}
              className="block text-left ps-4 ms-2 w-44 py-2 text-sm text-white rounded-md hover:bg-secondary-500 cursor-pointer"
            >
              {item.icon ? (
                <p className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </p>
              ) : (
                item.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
