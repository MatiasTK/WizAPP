import type { BulbState } from '@renderer/bindings/BulbState'
import { bulbHex, useCatalog } from '@renderer/lib/catalog'
import { cn } from '@renderer/lib/cn'
import type { CSSProperties } from 'react'

type BulbDotProps = {
  bulb: BulbState
  /** Diameter in px. */
  size: number
  /** Soft halo while the bulb is on (bulb cards). */
  glow?: boolean
  className?: string
}

/** Hook for the color a bulb shows, or `null` when offline (no color to show). */
export const useBulbHex = (bulb: BulbState): string | null => {
  const { byId } = useCatalog()
  return bulb.online ? bulbHex(bulb, byId) : null
}

/**
 * Decorative dot of a bulb. Lit: filled with its color, with a hairline edge so pale colors
 * (daylight, cold white) still show on a white card. Off: an empty ring, no color, because the
 * bulb gives none. Offline: a grey disc.
 */
export default function BulbDot({ bulb, size, glow = false, className }: BulbDotProps) {
  const hex = useBulbHex(bulb)
  const lit = hex !== null && bulb.state
  const off = hex !== null && !bulb.state
  const ring = Math.min(3, Math.max(1.5, Math.round(size / 10)))
  return (
    <span
      aria-hidden
      className={cn(
        'shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none',
        hex === null && 'bg-bulb-off',
        off && 'shadow-[inset_0_0_0_var(--ring-w)_var(--color-control)]',
        lit &&
          !glow &&
          'shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-fg)_32%,transparent)]',
        className
      )}
      style={
        {
          width: size,
          height: size,
          '--ring-w': `${ring}px`,
          backgroundColor: lit ? hex : undefined,
          boxShadow:
            glow && lit
              ? `inset 0 0 0 1px color-mix(in srgb, var(--color-fg) 32%, transparent), 0 0 0 6px ${hex}40, 0 0 28px 6px ${hex}55`
              : undefined
        } as CSSProperties
      }
    />
  )
}
