import { buttonClasses } from '@components/ui/Button'
import { useModalOpen, useReturnFocus } from '@components/ui/Dialog'
import * as RadixAlert from '@radix-ui/react-alert-dialog'
import { cn } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'

type AlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** A concrete verb, e.g. "Delete bulb". */
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
}

function AlertBody({
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
  onCloseAutoFocus
}: Omit<AlertDialogProps, 'open' | 'onOpenChange'> & { onCloseAutoFocus: (event: Event) => void }) {
  const { t } = useTranslation()

  return (
    <RadixAlert.Portal>
      <RadixAlert.Overlay className="fixed inset-0 z-(--z-dialog) bg-scrim" />
      <RadixAlert.Content
        onCloseAutoFocus={onCloseAutoFocus}
        className="fixed top-1/2 left-1/2 z-(--z-dialog) w-[calc(100vw-3rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface px-6 py-[22px] text-fg shadow-[0_24px_64px_rgb(0_0_0/0.28)]"
      >
        <RadixAlert.Title className="text-lg font-bold">{title}</RadixAlert.Title>
        <RadixAlert.Description className="mt-[18px] text-muted">
          {description}
        </RadixAlert.Description>
        <div className="mt-[18px] flex justify-end gap-2">
          {/* Radix puts the initial focus on Cancel, the safe choice. */}
          <RadixAlert.Cancel className={buttonClasses('secondary', 'large')}>
            {t('common.cancel')}
          </RadixAlert.Cancel>
          <RadixAlert.Action
            onClick={onConfirm}
            className={cn(buttonClasses(destructive ? 'destructive' : 'primary', 'large'))}
          >
            {confirmLabel}
          </RadixAlert.Action>
        </div>
      </RadixAlert.Content>
    </RadixAlert.Portal>
  )
}

export default function AlertDialog({ open, onOpenChange, ...body }: AlertDialogProps) {
  const handleCloseAutoFocus = useReturnFocus(open)
  useModalOpen(open)
  return (
    <RadixAlert.Root open={open} onOpenChange={onOpenChange}>
      <AlertBody {...body} onCloseAutoFocus={handleCloseAutoFocus} />
    </RadixAlert.Root>
  )
}
