import { cn, focusRing } from '@renderer/lib/cn'
import { ACCENT, accentStyle } from '@renderer/lib/light'

type SwitchProps = {
  isOn: boolean
  onToggle: () => void
  /** Accessible name, e.g. "Power for Living". */
  label: string
  /** The bulb's color: the on track takes it (darkened until it reads). Primary when omitted. */
  color?: string | null
  disabled?: boolean
  /** `sm` (44×26) for the sidebar card, `md` (48×28) for bulb cards. */
  size?: 'sm' | 'md'
  className?: string
}

/** On/off pill of a bulb: a toggle button whose `aria-pressed` says whether it is on. */
export default function Switch({
  isOn,
  onToggle,
  label,
  color,
  disabled = false,
  size = 'md',
  className
}: SwitchProps) {
  const lit = isOn && color
  return (
    <button
      type="button"
      aria-pressed={isOn}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      style={lit ? accentStyle(color) : undefined}
      className={cn(
        'flex shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-300',
        size === 'sm' ? 'h-[26px] w-11' : 'h-7 w-12',
        // The off track uses the control color so it reads against the card (WCAG 1.4.11).
        lit ? cn(ACCENT, 'bg-(--accent)') : isOn ? 'bg-primary' : 'bg-control',
        'disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block rounded-full bg-knob shadow-[0_1px_3px_rgb(0_0_0/0.3)] transition-transform',
          size === 'sm' ? 'size-5' : 'size-[22px]',
          isOn && (size === 'sm' ? 'translate-x-[18px]' : 'translate-x-5')
        )}
      />
    </button>
  )
}
