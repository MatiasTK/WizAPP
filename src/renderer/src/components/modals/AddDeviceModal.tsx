import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import Spinner from '@components/ui/Spinner'
import TextField from '@components/ui/TextField'
import { useBulbStore } from '@renderer/context/BulbStore'
import { isValidIPv4 } from '@renderer/lib/ip'
import { useState, type FormEvent } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

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
    if (result.outcome === 'added') return onDone()
    setError(t('errors.duplicateBulb'))
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <TextField
        label={t('home.add.ipLabel')}
        placeholder={t('home.add.example')}
        hint={t('home.add.hint')}
        value={ip}
        error={error}
        autoFocus
        inputMode="decimal"
        autoComplete="off"
        disabled={connecting}
        onChange={(e) => {
          setIp(e.target.value)
          setError(null)
        }}
      />
      {connecting && (
        <p role="status" className="flex items-center gap-2 text-[13px] text-muted">
          <Spinner />
          {t('home.add.connecting')}
        </p>
      )}
    </form>
  )
}

export default function AddDeviceModal({ open, onOpenChange }: AddDeviceModalProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  return (
    <Dialog
      open={open}
      // It does not close while a connection attempt is running.
      onOpenChange={(next) => (busy && !next ? undefined : onOpenChange(next))}
      title={t('home.add.title')}
      description={t('home.add.description')}
      footer={
        <>
          <Button size="large" disabled={busy} onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="large" disabled={busy}>
            {busy ? t('home.add.connecting') : t('common.add')}
          </Button>
        </>
      }
    >
      <AddForm onDone={() => onOpenChange(false)} onBusyChange={setBusy} />
    </Dialog>
  )
}
