import type { CSSProperties } from 'react'

/*
 * A bulb's color as a UI accent. The raw color of a bulb is often too pale to draw a control
 * with (warm white on a white card, daylight on a light track), so each control gets a version
 * of it with the same hue, moved in OKLCH lightness until it reads against everything it sits on.
 * Both themes are computed at once and picked in CSS, so no component needs to know the theme.
 */

type Rgb = [number, number, number]
type Oklch = [number, number, number]

/** What the accent must contrast with (3:1, WCAG 1.4.11), per theme. Kept in sync with main.css. */
export const ACCENT_BACKGROUNDS = {
  // surface/knob, track
  light: ['#ffffff', '#dfe3ea'],
  // knob, track (the surface is darker than the track, so the track is the binding one)
  dark: ['#ffffff', '#3a3d44']
} as const

export const MIN_ACCENT_CONTRAST = 3
/** Below this chroma a color reads as grey, like an off switch; whites get a hint of their hue. */
const MIN_CHROMA = 0.09
/** Hue for colors with none at all (pure white or grey): a cool white. */
const NEUTRAL_HUE = 250

const parseHex = (hex: string): Rgb => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb
}

const toHex = (rgb: Rgb) =>
  '#' +
  rgb
    .map((c) =>
      Math.round(Math.max(0, Math.min(1, c)) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

const rgbToOklch = (rgb: Rgb): Oklch => {
  const [r, g, b] = rgb.map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(A, B)
  const H = C < 0.02 ? NEUTRAL_HUE : (Math.atan2(B, A) * 180) / Math.PI
  return [L, C, H]
}

/** Linear sRGB; may fall outside [0, 1] when the color is out of gamut. */
const oklchToLinear = ([L, C, H]: Oklch): Rgb => {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
}

const inGamut = (rgb: Rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005)

/** The color at this lightness and hue with the most chroma sRGB allows, up to `C`. */
const fit = ([L, C, H]: Oklch): Rgb => {
  let c = C
  let rgb = oklchToLinear([L, c, H])
  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.005)
    rgb = oklchToLinear([L, c, H])
  }
  return rgb.map((v) => toGamma(Math.max(0, Math.min(1, v)))) as Rgb
}

export const luminance = (hex: string): number => {
  const [r, g, b] = parseHex(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const cache = new Map<string, string>()

/** The bulb's color, as close to the original as possible, readable on `backgrounds`. */
export const accentOn = (hex: string, backgrounds: readonly string[]): string => {
  const key = hex + backgrounds.join()
  const hit = cache.get(key)
  if (hit) return hit

  const [L, C, H] = rgbToOklch(parseHex(hex))
  const passes = (candidate: string) =>
    backgrounds.every((bg) => contrast(candidate, bg) >= MIN_ACCENT_CONTRAST)
  if (C >= MIN_CHROMA && passes(hex)) {
    cache.set(key, hex)
    return hex
  }
  // A darkened color loses vividness; a little extra chroma keeps warm white amber, not brown.
  const chroma = Math.max(C * 1.3, MIN_CHROMA)

  let best: string | null = null
  let bestDistance = Infinity
  for (let step = 0; step <= 200; step++) {
    const l = step / 200
    const candidate = toHex(fit([l, chroma, H]))
    const distance = Math.abs(l - L)
    if (distance < bestDistance && passes(candidate)) {
      best = candidate
      bestDistance = distance
    }
  }
  // Every hue has a passing lightness for these backgrounds; this is only a safety net.
  const result = best ?? '#5b6474'
  cache.set(key, result)
  return result
}

/** Light and dark accents of a bulb color, both computed once. */
export const accentPair = (hex: string) => ({
  light: accentOn(hex, ACCENT_BACKGROUNDS.light),
  dark: accentOn(hex, ACCENT_BACKGROUNDS.dark)
})

/**
 * Put `ACCENT` on an element together with `accentStyle(hex)`; inside it `--accent` is the bulb
 * color for the current theme (`bg-(--accent)`, `border-(--accent)`).
 */
export const ACCENT = '[--accent:var(--accent-l)] dark:[--accent:var(--accent-d)]'

export const accentStyle = (hex: string): CSSProperties => {
  const { light, dark } = accentPair(hex)
  return { '--accent-l': light, '--accent-d': dark } as CSSProperties
}
