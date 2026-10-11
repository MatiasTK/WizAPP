import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import TextField from '@components/ui/TextField'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_NAME_LENGTH = 15
const FORM_ID = 'rename-bulb-form'

type EditNameModalProps = {
  /** The bulb being renamed; `null` keeps the dialog closed. */
  bulb: BulbState | null
  onOpenChange: (open: boolean) => void
}

function NameForm({ bulb, onDone }: { bulb: BulbState; onDone: () => void }) {
  const { t } = useTranslation()
  const setBulbName = useBulbStore((s) => s.setBulbName)
  const [name, setName] = useState(bulb.name)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') return setError(t('errors.emptyName'))
    if (trimmed.length > MAX_NAME_LENGTH) return setError(t('errors.longName'))
    if (trimmed === bulb.name) return setError(t('errors.sameName'))

    void setBulbName(trimmed, bulb.ip)
    onDone()
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
      <TextField
        label={t('bulb.newName')}
        placeholder={t('bulb.namePlaceholder')}
        value={name}
        error={error}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
      />
    </form>
  )
}

export default function EditNameModal({ bulb, onOpenChange }: EditNameModalProps) {
  const { t } = useTranslation()
  const close = () => onOpenChange(false)

  return (
    <Dialog
      open={bulb !== null}
      onOpenChange={onOpenChange}
      title={t('bulb.renameTitle')}
      footer={
        <>
          <Button onClick={close}>{t('common.cancel')}</Button>
          <Button type="submit" form={FORM_ID} variant="primary">
            {t('common.save')}
          </Button>
        </>
      }
    >
      {bulb && <NameForm key={bulb.ip} bulb={bulb} onDone={close} />}
    </Dialog>
  )
}
