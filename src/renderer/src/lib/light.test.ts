import { scenes } from 'src/renderer/utils/scenesInfo'
import { describe, expect, it } from 'vitest'
import { ACCENT_BACKGROUNDS, MIN_ACCENT_CONTRAST, accentPair, contrast } from './light'

// Every scene color, the white-temperature range and the extremes a custom color can take.
const colors = [
  ...scenes.flatMap((s) => [s.hex, s.hex2].filter((h): h is string => h !== undefined)),
  '#ffb26e',
  '#fff2fa',
  '#ffffff',
  '#000000',
  '#808080',
  '#0000ff',
  '#ffff00',
  '#00ffff'
]

describe('bulb accent', () => {
  it.each(colors)('%s reads on every background of both themes', (hex) => {
    const pair = accentPair(hex)
    for (const theme of ['light', 'dark'] as const) {
      for (const bg of ACCENT_BACKGROUNDS[theme]) {
        expect(contrast(pair[theme], bg)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST)
      }
    }
  })

  it('keeps a color that already reads as it is', () => {
    expect(accentPair('#1b4fa8').light).toBe('#1b4fa8')
  })

  it('darkens warm white in light and keeps it warm', () => {
    const { light } = accentPair('#ffc979')
    expect(light).not.toBe('#ffc979')
    // Still more red than blue: the same hue, only darker.
    expect(parseInt(light.slice(1, 3), 16)).toBeGreaterThan(parseInt(light.slice(5, 7), 16))
  })
})
