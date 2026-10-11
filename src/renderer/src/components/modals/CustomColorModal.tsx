import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import TextField from '@components/ui/TextField'
import type { CustomColor } from '@renderer/bindings/CustomColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useColors } from '@renderer/lib/catalog'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_NAME_LENGTH = 10
const FORM_ID = 'custom-color-form'

type CustomColorModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; absent for a new color. */
  editing?: CustomColor
}

function ColorForm({ editing, onDone }: { editing?: CustomColor; onDone: () => void }) {
  const { t } = useTranslation()
  const colors = useColors()
  const addCustomColor = useBulbStore((s) => s.addCustomColor)
  const editCustomColor = useBulbStore((s) => s.editCustomColor)

  const [name, setName] = useState(editing?.name ?? '')
  const [hex, setHex] = useState(editing?.hex ?? '#3772ff')
  const [error, setError] = useState<string | null>(null)

  const validate = (value: string): string | null => {
    const trimmed = value.trim()
    if (trimmed.length === 0) return t('errors.emptyName')
    if (trimmed.length > MAX_NAME_LENGTH) return t('errors.customLongName')
    const duplicate = colors.some(
      (c) => c.id !== editing?.id && c.name.toLowerCase() === trimmed.toLowerCase()
    )
    return duplicate ? t('errors.duplicateColor') : null
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const problem = validate(name)
    setError(problem)
    if (problem) return

    const trimmed = name.trim()
    if (editing) void editCustomColor(editing.id, trimmed, hex)
    else void addCustomColor(trimmed, hex)
    onDone()
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t('scenes.color.name')}
        placeholder={t('scenes.color.namePlaceholder')}
        value={name}
        error={error}
        autoFocus
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="custom-color-hex" className="text-sm font-medium">
          {t('scenes.color.color')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="custom-color-hex"
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded-md border border-control bg-surface p-1"
          />
          <span className="text-sm text-muted tabular-nums">{hex.toUpperCase()}</span>
        </div>
      </div>
    </form>
  )
}

export default function CustomColorModal({ open, onOpenChange, editing }: CustomColorModalProps) {
  const { t } = useTranslation()
  const close = () => onOpenChange(false)

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? t('scenes.color.editTitle') : t('scenes.color.newTitle')}
      footer={
        <>
          <Button onClick={close}>{t('common.cancel')}</Button>
          <Button type="submit" form={FORM_ID} variant="primary">
            {editing ? t('common.save') : t('common.add')}
          </Button>
        </>
      }
    >
      <ColorForm editing={editing} onDone={close} />
    </Dialog>
  )
}
