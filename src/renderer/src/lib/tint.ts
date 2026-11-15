/**
 * Soft wash of the bulb's own color behind a header or strip. The element sets `--tint` to the
 * bulb's hex; the dark theme needs a stronger mix to stay visible.
 */
export const TINT =
  'bg-[color-mix(in_srgb,var(--tint)_8%,transparent)] dark:bg-[color-mix(in_srgb,var(--tint)_20%,transparent)]'
