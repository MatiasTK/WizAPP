import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import TextField from '@components/ui/TextField'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_NAME_LENGTH = 24
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
  // Allowed, but two bulbs with one name are hard to tell apart in the list and in search.
  const takenByOther = useBulbStore((s) =>
    s.bulbs.some((b) => b.ip !== bulb.ip && b.name.toLowerCase() === name.trim().toLowerCase())
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedOnce = useRef(false)

  // The error is about the field, so the focus goes back to it.
  useEffect(() => {
    if (error) inputRef.current?.focus()
  }, [error])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') return setError(t('errors.emptyName'))
    if (trimmed.length > MAX_NAME_LENGTH) return setError(t('errors.longName'))
    // Saving the same name is not a mistake; there is just nothing to do.
    if (trimmed === bulb.name) return onDone()

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
        ref={inputRef}
        hint={
          takenByOther
            ? `${t('bulb.nameTaken')} ${t('common.charCount', { count: name.trim().length, max: MAX_NAME_LENGTH })}`
            : t('common.charCount', { count: name.trim().length, max: MAX_NAME_LENGTH })
        }
        hintTone={name.trim().length > MAX_NAME_LENGTH ? 'danger' : 'muted'}
        autoFocus
        data-autofocus
        // Selected once, to replace it quickly; not when the focus comes back after an error.
        onFocus={(e) => {
          if (selectedOnce.current) return
          selectedOnce.current = true
          e.currentTarget.select()
        }}
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
      title={t('bulb.renameTitle', { name: bulb?.name ?? '' })}
      footer={
        <>
          <Button size="large" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="large">
            {t('common.save')}
          </Button>
        </>
      }
    >
      {bulb && <NameForm key={bulb.ip} bulb={bulb} onDone={close} />}
    </Dialog>
  )
}
