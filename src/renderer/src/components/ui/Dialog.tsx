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
        aria-describedby={description ? undefined : undefined}
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          'fixed top-1/2 left-1/2 z-(--z-dialog) flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface text-fg shadow-xl',
          className
        )}
      >
        {hideTitle && <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>}
        <header
          className={cn('flex items-start justify-between gap-4 px-6 pt-6', hideTitle && 'hidden')}
        >
          <div className="min-w-0">
            {!hideTitle && (
              <RadixDialog.Title className="text-xl font-semibold">{title}</RadixDialog.Title>
            )}
            {description && (
              <RadixDialog.Description className="mt-1.5 text-sm text-muted">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <IconButton label={t('common.close')} tooltip={false} className="-mt-1 -mr-2">
              <LuX size={16} aria-hidden />
            </IconButton>
          </RadixDialog.Close>
        </header>
        <div className="min-h-0 grow overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-3 px-6 pt-1 pb-6">{footer}</footer>}
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
