import { cn } from '@renderer/lib/cn'

const STAR =
  'M12 1.5c.7 6.4 3.7 9.6 10.5 10.5-6.8.9-9.8 4.1-10.5 10.5C11.3 16.1 8.3 12.9 1.5 12 8.3 11.1 11.3 7.9 12 1.5Z'

type LogoProps = {
  /** Font size in px; the star scales with it. */
  size?: number
  className?: string
}

/** The hand-drawn "wız" mark: a dotless ı whose dot is a four-point star. Our own, not WiZ's. */
export default function Logo({ size = 50, className }: LogoProps) {
  const star = Math.round(size * 0.42)
  return (
    <span
      role="img"
      aria-label="WiZ APP"
      className={cn('inline-flex items-end font-logo leading-none font-bold text-fg', className)}
      style={{ fontSize: size }}
    >
      <span aria-hidden>w</span>
      <span aria-hidden className="relative inline-block">
        ı
        <svg
          width={star}
          height={star}
          viewBox="0 0 24 24"
          className="absolute left-1/2 -translate-x-1/2 fill-logo-star"
          style={{ top: -Math.round(size * 0.2) }}
        >
          <path d={STAR} />
        </svg>
      </span>
      <span aria-hidden>z</span>
    </span>
  )
}
