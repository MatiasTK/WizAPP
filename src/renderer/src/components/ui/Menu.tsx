import { useRef } from 'react'
import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@renderer/lib/cn'
import type { ReactElement, ReactNode } from 'react'

export type MenuItem = {
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

type MenuProps = {
  /** The element that opens the menu (a button). */
  trigger: ReactElement
  items: MenuItem[]
  align?: 'start' | 'center' | 'end'
}

export default function Menu({ trigger, items, align = 'end' }: MenuProps) {
  const picked = useRef(false)
  const opener = useRef<HTMLElement | null>(null)
  return (
    <RadixMenu.Root
      onOpenChange={(open) => {
        if (open) opener.current = document.activeElement as HTMLElement | null
      }}
    >
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          // An item that opens a dialog (rename, edit, remove) leaves the focus to it: giving it
          // back to the trigger now would pull it out of the dialog, which returns it there when
          // it closes. With no dialog (or after Esc / a click outside) the trigger gets it back.
          onCloseAutoFocus={(event) => {
            if (!picked.current) return
            picked.current = false
            event.preventDefault()
            window.setTimeout(() => {
              if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
              if (document.activeElement === document.body) opener.current?.focus()
            }, 0)
          }}
          className="z-(--z-menu) min-w-44 rounded-[12px] border border-border bg-surface p-1 shadow-[0_12px_32px_rgb(0_0_0/0.2)]"
        >
          {items.map((item) => (
            <RadixMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={() => {
                picked.current = true
                item.onSelect()
              }}
              className={cn(
                'flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-sm outline-none',
                'data-disabled:cursor-not-allowed data-disabled:opacity-50',
                item.destructive
                  ? 'text-danger-text data-highlighted:bg-danger-soft'
                  : 'text-fg data-highlighted:bg-raised'
              )}
            >
              {item.icon && <span aria-hidden>{item.icon}</span>}
              {item.label}
            </RadixMenu.Item>
          ))}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}
