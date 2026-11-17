import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import TextField from '@components/ui/TextField'
import type { CustomColor } from '@renderer/bindings/CustomColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog, useColors } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { normalizeText } from '@renderer/lib/search'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_NAME_LENGTH = 16
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
/** Spoken names of `PALETTE`, in the same order (keys under `scenes.color.swatches`). */
const SWATCH_NAMES = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'turquoise',
  'blue',
  'navy',
  'indigo',
  'violet',
  'purple',
  'raspberry',
  'pink',
  'warmWhite',
  'coolWhite'
] as const

type CustomColorModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; absent for a new color. */
  editing?: CustomColor
}

function ColorForm({ editing, onDone }: { editing?: CustomColor; onDone: () => void }) {
  const { t, i18n } = useTranslation()
  const colors = useColors()
  const { builtIn } = useCatalog()
  const addCustomColor = useBulbStore((s) => s.addCustomColor)
  const pushToast = useBulbStore((s) => s.pushToast)
  const editCustomColor = useBulbStore((s) => s.editCustomColor)

  const [name, setName] = useState(editing?.name ?? '')
  const [hex, setHex] = useState(editing?.hex ?? DEFAULT_COLOR)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // The error is about the name, so the focus goes back to it (and it is read with the field).
  useEffect(() => {
    if (error) nameRef.current?.focus()
  }, [error])
  const isCustomHex = !PALETTE.includes(hex.toLowerCase())

  const validate = (value: string): string | null => {
    const trimmed = value.trim()
    if (trimmed.length === 0) return t('errors.emptyName')
    if (trimmed.length > MAX_NAME_LENGTH) return t('errors.customLongName')
    const same = (other: string) => normalizeText(other) === normalizeText(trimmed)
    if (colors.some((c) => c.id !== editing?.id && same(c.name))) return t('errors.duplicateColor')
    // A color named like a built-in scene would show up twice in search, with no way to tell.
    // In either language: the other one would show two "Party" entries.
    const sceneNames = builtIn.flatMap((s) =>
      (['en', 'es'] as const).map((lng) => i18n.getFixedT(lng)(`scenes.names.${s.key}`))
    )
    if (sceneNames.some(same)) return t('errors.sceneNameTaken')
    return null
  }

  // Arrows move through the swatches (8 per row) and pick them, like any radio group.
  const handleSwatchKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    const current = Math.max(0, PALETTE.indexOf(hex.toLowerCase()))
    const next = (current + step + PALETTE.length) % PALETTE.length
    setHex(PALETTE[next])
    event.currentTarget.querySelector<HTMLElement>(`[data-swatch="${next}"]`)?.focus()
  }

  // A taken or too long name shows up while typing; an empty one only on submit.
  const liveProblem = name.trim() === '' ? null : validate(name)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const problem = validate(name)
    setError(problem)
    if (problem) return

    const trimmed = name.trim()
    if (editing) {
      void editCustomColor(editing.id, trimmed, hex).then((saved) => {
        if (saved) pushToast('scenes.color.updated', 'success', { name: trimmed })
      })
    } else {
      // Confirmed only once the backend saved it; a failure shows its own error toast.
      void addCustomColor(trimmed, hex).then((saved) => {
        if (saved) pushToast('scenes.color.created', 'success', { name: trimmed })
      })
    }
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
          ref={nameRef}
          label={t('scenes.color.name')}
          placeholder={t('scenes.color.namePlaceholder')}
          value={name}
          error={error}
          hint={
            liveProblem
              ? `${liveProblem} ${t('common.charCount', { count: name.trim().length, max: MAX_NAME_LENGTH })}`
              : t('common.charCount', { count: name.trim().length, max: MAX_NAME_LENGTH })
          }
          hintTone={liveProblem ? 'danger' : 'muted'}
          autoFocus
          data-autofocus
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{t('scenes.color.color')}</legend>
        <div
          role="radiogroup"
          aria-label={t('scenes.color.color')}
          onKeyDown={handleSwatchKeys}
          className="grid grid-cols-8 gap-2"
        >
          {PALETTE.map((color, i) => (
            <button
              key={color}
              type="button"
              role="radio"
              data-swatch={i}
              aria-checked={hex.toLowerCase() === color}
              // One tab stop for the group: the checked swatch, or the first one.
              tabIndex={hex.toLowerCase() === color || (isCustomHex && i === 0) ? 0 : -1}
              aria-label={t(`scenes.color.swatches.${SWATCH_NAMES[i]}`)}
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
