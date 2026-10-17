import type { BulbState } from '@renderer/bindings/BulbState'
import type { CustomColor } from '@renderer/bindings/CustomColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { scenes } from 'src/renderer/utils/scenesInfo'

/** A built-in scene or a custom color, with its name in the current language. */
export type CatalogEntry = {
  id: number
  kind: 'scene' | 'color'
  name: string
  /** Main color; also the color of a bulb that runs this entry. */
  hex: string
  /** CSS background of the swatch: a gradient for dynamic scenes. */
  swatch: string
  group: 'static' | 'dynamic' | 'custom'
}

const EMPTY_COLORS: CustomColor[] = []
const EMPTY_FAVORITES: number[] = []

const swatchOf = (hex: string, hex2?: string) =>
  hex2 ? `linear-gradient(135deg, ${hex}, ${hex2})` : hex

/** Colors and favorites are global but travel inside every bulb's state. */
export const useColors = (): CustomColor[] =>
  useBulbStore((s) => (s.activeBulb ?? s.bulbs[0])?.customColors ?? EMPTY_COLORS)

export const useFavoriteIds = (): number[] =>
  useBulbStore((s) => (s.activeBulb ?? s.bulbs[0])?.favoriteColors ?? EMPTY_FAVORITES)

export const useCatalog = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const favoriteIds = useFavoriteIds()

  return useMemo(() => {
    const builtIn: CatalogEntry[] = scenes.map((s) => ({
      id: s.id,
      kind: 'scene',
      name: t(`scenes.names.${s.name}`),
      hex: s.hex,
      swatch: swatchOf(s.hex, s.hex2),
      group: s.type
    }))
    const custom: CatalogEntry[] = colors.map((c) => ({
      id: c.id,
      kind: 'color',
      name: c.name,
      hex: c.hex,
      swatch: c.hex,
      group: 'custom'
    }))
    const all = [...builtIn, ...custom]
    const byId = new Map(all.map((e) => [e.id, e]))
    const favorites = favoriteIds
      .map((id) => byId.get(id))
      .filter((e): e is CatalogEntry => e !== undefined)
    return { builtIn, custom, all, byId, favorites }
    // `t` changes with the language.
  }, [t, colors, favoriteIds])
}

const hex2 = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')

/** Rough sRGB of a white color temperature (2200–6500 K), enough for a dot. */
const kelvinToHex = (kelvin: number) => {
  const k = Math.max(2200, Math.min(6500, kelvin))
  const f = (k - 2200) / (6500 - 2200)
  return `#ff${hex2(178 + f * 64)}${hex2(110 + f * 140)}`
}

/** Fallback when the bulb reports nothing usable: warm white. */
const DEFAULT_BULB_HEX = '#ffc979'

/** The color a bulb is showing: its scene, its RGB values or its white temperature. */
export const bulbHex = (bulb: BulbState, byId: Map<number, CatalogEntry>): string => {
  const entry = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
  if (entry) return entry.hex
  if (bulb.r != null && bulb.g != null && bulb.b != null && bulb.r + bulb.g + bulb.b > 0) {
    return `#${hex2(bulb.r)}${hex2(bulb.g)}${hex2(bulb.b)}`
  }
  if (bulb.temp) return kelvinToHex(bulb.temp)
  return DEFAULT_BULB_HEX
}
