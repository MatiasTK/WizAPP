import type { CustomColor } from '@renderer/bindings/CustomColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useMemo } from 'react'
import type { IconType } from 'react-icons'
import { useTranslation } from 'react-i18next'
import { scenes } from 'src/renderer/utils/scenesInfo'

/** A built-in scene or a custom color, with its name in the current language. */
export type CatalogEntry = {
  id: number
  kind: 'scene' | 'color'
  name: string
  icon?: IconType
  hex?: string
  group: 'static' | 'dynamic' | 'custom'
}

const EMPTY_COLORS: CustomColor[] = []
const EMPTY_FAVORITES: number[] = []

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
      icon: s.icon,
      group: s.type
    }))
    const custom: CatalogEntry[] = colors.map((c) => ({
      id: c.id,
      kind: 'color',
      name: c.name,
      hex: c.hex,
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
