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
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          className="z-(--z-menu) min-w-44 rounded-[12px] border border-border bg-surface p-1 shadow-[0_12px_32px_rgb(0_0_0/0.2)]"
        >
          {items.map((item) => (
            <RadixMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
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
