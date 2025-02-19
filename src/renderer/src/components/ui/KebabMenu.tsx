import { useEffect, useRef, useState } from 'react'
import { LuEllipsisVertical } from 'react-icons/lu'

type KebabMenuProps = {
  items: {
    label: string
    icon?: JSX.Element
    onClick: () => void
  }[]
}

export default function KebabMenu({ items }: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        className="cursor-pointer text-neutral-300 hover:text-white transition-all duration-300 rounded-xl p-1"
        onClick={handleToggle}
      >
        <LuEllipsisVertical size={20} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-5 mt-2 py-2 w-48 bg-secondary-700 rounded-md shadow-lg z-50 border border-secondary-500 transition-all animate-fade-in-down animate-steps-modern animate-duration-200">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => handleClickItem(e, item)}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-secondary-600 cursor-pointer"
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
