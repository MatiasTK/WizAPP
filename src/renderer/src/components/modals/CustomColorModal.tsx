import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import TextField from '@components/ui/TextField'
import type { CustomColor } from '@renderer/bindings/CustomColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useColors } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_NAME_LENGTH = 10
const FORM_ID = 'custom-color-form'

/** Suggested colors; any other one can still be picked with the system color picker. */
export const PALETTE = [
  '#ff4d4d',
  '#ff8a4c',
  '#ffb35c',
  '#ffd23f',
  '#a3c94b',
  '#3f9a52',
  '#38c6c9',
  '#2f7fd8',
  '#1b4fa8',
  '#5a2fe0',
  '#8a5cf0',
  '#c45cff',
  '#e2477a',
  '#ff8fb0',
  '#ffc979',
  '#eef2ff'
]
export const DEFAULT_COLOR = '#38c6c9'

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
  const [hex, setHex] = useState(editing?.hex ?? DEFAULT_COLOR)
  const [error, setError] = useState<string | null>(null)
  const isCustomHex = !PALETTE.includes(hex.toLowerCase())

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
    <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="size-[72px] shrink-0 rounded-lg"
          style={{ backgroundColor: hex, boxShadow: `0 0 32px ${hex}66` }}
        />
        <TextField
          wrapperClassName="grow"
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
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{t('scenes.color.color')}</legend>
        <div className="grid grid-cols-8 gap-2">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              aria-pressed={hex.toLowerCase() === color}
              aria-label={color}
              onClick={() => setHex(color)}
              className={cn(
                'h-[34px] cursor-pointer rounded-[9px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]',
                hex.toLowerCase() === color && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                focusRing
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <label className="mt-1 flex w-fit cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className={cn(
              'h-8 w-11 cursor-pointer rounded-sm border border-control bg-surface p-0.5',
              isCustomHex && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
              focusRing
            )}
          />
          {t('scenes.color.other')}
          <span className="tabular-nums">{hex.toUpperCase()}</span>
        </label>
      </fieldset>
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
      className="max-w-[480px]"
      footer={
        <>
          <Button size="large" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="large">
            {editing ? t('common.save') : t('scenes.color.create')}
          </Button>
        </>
      }
    >
      <ColorForm editing={editing} onDone={close} />
    </Dialog>
  )
}
