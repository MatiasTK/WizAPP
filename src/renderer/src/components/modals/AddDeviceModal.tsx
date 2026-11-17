import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import Spinner from '@components/ui/Spinner'
import TextField from '@components/ui/TextField'
import { useBulbStore } from '@renderer/context/BulbStore'
import { isValidIPv4 } from '@renderer/lib/ip'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

const FORM_ID = 'add-bulb-form'

type AddDeviceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AddForm({
  onDone,
  onBusyChange
}: {
  onDone: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const { t } = useTranslation()
  const addBulbByIp = useBulbStore((s) => s.addBulbByIp)
  const [ip, setIp] = useState('')
  // Known while typing, like a taken name elsewhere; the submit still refuses it.
  const existingName = useBulbStore((s) => s.bulbs.find((b) => b.ip === ip.trim())?.name)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // The field is disabled while connecting, which drops the focus; give it back with the error.
  useEffect(() => {
    if (error && !connecting) inputRef.current?.focus()
  }, [error, connecting])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (connecting) return

    const value = ip.trim()
    if (value === '') return setError(t('errors.emptyIp'))
    if (!isValidIPv4(value)) return setError(t('errors.invalidIP'))

    setError(null)
    setConnecting(true)
    onBusyChange(true)
    const result = await addBulbByIp(value)
    setConnecting(false)
    onBusyChange(false)

    // On failure the dialog stays open and keeps what was typed.
    if ('code' in result) {
      return setError(
        result.code === 'bulbUnreachable' ? t('errors.unreachable') : t('errors.addFailed')
      )
    }
    if (result.outcome === 'added') {
      // Select it and say so: it lands at the end of the list, maybe out of view.
      const added = useBulbStore.getState().bulbs.find((b) => b.ip === value)
      if (added) void useBulbStore.getState().setActiveBulb(value)
      useBulbStore.getState().pushToast('home.add.added', 'success', { name: added?.name ?? value })
      return onDone()
    }
    const existing = useBulbStore.getState().bulbs.find((b) => b.ip === value)
    setError(t('errors.duplicateBulb', { name: existing?.name ?? value }))
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <TextField
        label={t('home.add.ipLabel')}
        placeholder={t('home.add.example')}
        hint={existingName ? t('errors.duplicateBulb', { name: existingName }) : t('home.add.hint')}
        hintTone={existingName ? 'danger' : 'muted'}
        ref={inputRef}
        value={ip}
        error={error}
        autoFocus
        data-autofocus
        inputMode="decimal"
        autoComplete="off"
        // Read-only, not disabled, so the focus stays in the field while it connects.
        readOnly={connecting}
        aria-busy={connecting || undefined}
        onChange={(e) => {
          setIp(e.target.value)
          setError(null)
        }}
      />
      {/* Announced only; the submit button already shows the spinner and "Connecting". */}
      <p role="status" className="sr-only">
        {connecting ? t('home.add.connecting') : ''}
      </p>
    </form>
  )
}

export default function AddDeviceModal({ open, onOpenChange }: AddDeviceModalProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('home.add.title')}
      description={t('home.add.description')}
      footer={
        <>
          <Button size="large" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="large" disabled={busy}>
            {busy && <Spinner />}
            {busy ? t('home.add.connecting') : t('common.add')}
          </Button>
        </>
      }
    >
      <AddForm onDone={() => onOpenChange(false)} onBusyChange={setBusy} />
    </Dialog>
  )
}
