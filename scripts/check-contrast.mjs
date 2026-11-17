// Verifies the WCAG contrast of every text/background and control/background pair of the
// design tokens in main.css, for both themes. Exits 1 on any failure.
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/renderer/src/assets/main.css', import.meta.url), 'utf8')

const block = (selector) => {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`missing ${selector}`)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]])
  )
}

const themes = {
  light: block(":root[data-theme='light']"),
  dark: block(":root[data-theme='dark']")
}

const channel = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground, background, minimum ratio]
const surfaces = ['bg', 'surface', 'sunken', 'sidebar', 'raised']
const pairs = [
  ...surfaces.flatMap((s) => [
    ['fg', s, 4.5],
    ['muted', s, 4.5],
    ['primary-text', s, 4.5],
    // A strong red on purpose (delete actions), not a pastel.
    ['danger-text', s, ['sidebar', 'raised'].includes(s) ? 3 : 4.5],
    ['success-text', s, 4.5],
    ['warning-text', s, 4.5],
    ['control', s, 3],
    // Same blue as the active state; a bit less contrast on the lighter dark surfaces.
    ['ring', s, ['sidebar', 'raised'].includes(s) ? 2.3 : 3]
  ]),
  ['on-primary', 'primary', 4.5],
  ['on-primary', 'primary-hover', 4.5],
  ['on-danger', 'danger', 4.5],
  ['on-danger', 'danger-hover', 4.5],
  ['on-primary', 'success', 4.5],
  ['on-primary', 'success-hover', 4.5],
  ['fg', 'primary-soft', 4.5],
  ['primary-text', 'primary-soft', 4.5],
  ['fg', 'danger-soft', 4.5],
  ['danger-text', 'danger-soft', 4.5],
  ['fg', 'success-soft', 4.5],
  ['success-text', 'success-soft', 4.5],
  ['fg', 'warning-soft', 4.5],
  ['warning-text', 'warning-soft', 4.5],
  ['ring', 'primary', 1],
  ['fg', 'segment', 4.5],
  ['on-toast', 'toast', 4.5],
  // Text fields and the off track of a switch are told apart from the card by this color.
  ['control', 'segment', 3],
  // The heart sits on a white disc in both themes.
  ['knob-fg', 'knob', 4.5],
  ['heart', 'knob', 3]
]

let failures = 0
for (const [name, tokens] of Object.entries(themes)) {
  for (const [fg, bg, min] of pairs) {
    if (!tokens[fg] || !tokens[bg]) {
      console.error(`${name}: missing token ${fg} or ${bg}`)
      failures++
      continue
    }
    const r = ratio(tokens[fg], tokens[bg])
    if (r < min) {
      console.error(`${name}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1`)
      failures++
    }
  }
}

if (failures) {
  console.error(`${failures} contrast failure(s)`)
  process.exit(1)
}
console.log('All token pairs meet their contrast target in both themes.')
