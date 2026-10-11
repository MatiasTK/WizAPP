import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'

type PowerButtonProps = {
  isOn: boolean
  onToggle: () => void
  disabled?: boolean
  /** What the switch controls, e.g. the bulb name. */
  label: string
  /** `sm` for compact places such as the sidebar card. */
  size?: 'sm' | 'md'
  className?: string
}

/** The on/off switch of a bulb. */
export default function PowerButton({
  isOn,
  onToggle,
  disabled = false,
  label,
  size = 'md',
  className
}: PowerButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={t('bulb.power', { name: label })}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors',
        size === 'sm' ? 'h-6 w-10' : 'h-7 w-12',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isOn ? 'border-primary bg-primary' : 'border-control bg-sunken',
        focusRing,
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block rounded-full transition-transform',
          size === 'sm' ? 'size-4' : 'size-5',
          isOn
            ? cn('bg-on-primary', size === 'sm' ? 'translate-x-[18px]' : 'translate-x-6')
            : cn('bg-control', size === 'sm' ? 'translate-x-0.5' : 'translate-x-1')
        )}
      />
    </button>
  )
}
