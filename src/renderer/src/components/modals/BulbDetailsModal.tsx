import BulbFacts from '@components/BulbFacts'
import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useTranslation } from 'react-i18next'

type BulbDetailsModalProps = {
  /** The bulb shown; `null` keeps the dialog closed. */
  bulb: BulbState | null
  onOpenChange: (open: boolean) => void
}

export default function BulbDetailsModal({ bulb, onOpenChange }: BulbDetailsModalProps) {
  const { t } = useTranslation()

  const status = !bulb
    ? ''
    : !bulb.online
      ? t('information.offlineStatus')
      : bulb.state
        ? t('bulb.on')
        : t('bulb.off')

  return (
    <Dialog
      open={bulb !== null}
      onOpenChange={onOpenChange}
      title={bulb?.name ?? t('bulb.details')}
      footer={
        <Button size="large" onClick={() => onOpenChange(false)}>
          {t('common.close')}
        </Button>
      }
    >
      {bulb && <BulbFacts bulb={bulb} status={status} />}
    </Dialog>
  )
}
