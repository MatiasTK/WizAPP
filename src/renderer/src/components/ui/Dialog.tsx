import IconButton from '@components/ui/IconButton'
import * as RadixDialog from '@radix-ui/react-dialog'
import { useOverlayStore } from '@renderer/context/OverlayStore'
import { cn } from '@renderer/lib/cn'
import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuX } from 'react-icons/lu'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** Hides the visible title (it stays available to assistive technology). */
  hideTitle?: boolean
}

/** Registers an open modal in the OverlayStore. */
export const useModalOpen = (active = true) => {
  useEffect(() => {
    if (!active) return undefined
    return useOverlayStore.getState().enter()
  }, [active])
}

/**
 * Radix only returns focus to a `Dialog.Trigger`, but ours are opened from state (buttons,
 * menu items, shortcuts). This remembers what had the focus when `open` turned true and
 * gives the returned handler for `onCloseAutoFocus` to put it back.
 */
export const useReturnFocus = (open: boolean) => {
  const target = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)

  if (open && !wasOpen.current) {
    // A dialog opened from a menu item: the item is about to disappear, the menu's
    // trigger is the sensible place to come back to.
    const menuTrigger = document.querySelector<HTMLElement>(
      '[aria-haspopup="menu"][aria-expanded="true"]'
    )
    target.current = menuTrigger ?? (document.activeElement as HTMLElement | null)
  }
  wasOpen.current = open

  return (event: Event) => {
    event.preventDefault()
    if (target.current?.isConnected) target.current.focus()
  }
}

function DialogBody({
  title,
  description,
  children,
  footer,
  className,
  hideTitle,
  onCloseAutoFocus
}: Omit<DialogProps, 'open' | 'onOpenChange'> & { onCloseAutoFocus: (event: Event) => void }) {
  const { t } = useTranslation()

  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-(--z-dialog) bg-scrim" />
      <RadixDialog.Content
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          'fixed top-1/2 left-1/2 z-(--z-dialog) flex max-h-[calc(100vh-3rem)] w-[calc(100vw-3rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-surface text-fg shadow-[0_24px_64px_rgb(0_0_0/0.28)]',
          className
        )}
      >
        {hideTitle && <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>}
        <header
          className={cn(
            'flex items-start justify-between gap-3 px-6 pt-[22px]',
            hideTitle && 'hidden'
          )}
        >
          <div className="min-w-0">
            {!hideTitle && (
              <RadixDialog.Title className="text-lg font-bold">{title}</RadixDialog.Title>
            )}
            {description && (
              <RadixDialog.Description className="mt-1.5 text-muted">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <IconButton
              label={t('common.close')}
              tooltip={false}
              className="-mt-1 -mr-2 size-[34px]"
            >
              <LuX size={18} aria-hidden />
            </IconButton>
          </RadixDialog.Close>
        </header>
        <div className="min-h-0 grow overflow-y-auto px-6 pt-[18px] pb-[22px]">{children}</div>
        {footer && (
          <footer className="-mt-1 flex justify-end gap-2 px-6 pb-[22px]">{footer}</footer>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export default function Dialog({ open, onOpenChange, ...body }: DialogProps) {
  const handleCloseAutoFocus = useReturnFocus(open)
  useModalOpen(open)
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogBody {...body} onCloseAutoFocus={handleCloseAutoFocus} />
    </RadixDialog.Root>
  )
}
