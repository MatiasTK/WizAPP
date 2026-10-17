import type { BulbState } from '@renderer/bindings/BulbState'
import { bulbHex, useCatalog } from '@renderer/lib/catalog'
import { cn } from '@renderer/lib/cn'

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

/** Decorative dot in the bulb's current color; dimmed while off, grey while offline. */
export default function BulbDot({ bulb, size, glow = false, className }: BulbDotProps) {
  const hex = useBulbHex(bulb)
  const lit = hex !== null && bulb.state
  return (
    <span
      aria-hidden
      className={cn('shrink-0 rounded-full', hex === null && 'bg-bulb-off', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: hex ?? undefined,
        opacity: hex !== null && !bulb.state ? 0.35 : undefined,
        boxShadow: glow && lit ? `0 0 0 6px ${hex}40, 0 0 28px 6px ${hex}55` : undefined
      }}
    />
  )
}
