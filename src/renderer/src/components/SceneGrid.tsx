import SceneTile from '@components/SceneTile'
import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog, useFavoriteIds, type CatalogEntry } from '@renderer/lib/catalog'
import { matches } from '@renderer/lib/search'
import { useTranslation } from 'react-i18next'
import { LuPalette, LuPlus } from 'react-icons/lu'

export type SceneGroup = 'all' | 'static' | 'dynamic' | 'custom'

type SceneGridProps = {
  /** The bulb tiles are applied to (and checked against). */
  bulb: BulbState | null
  query: string
  group: SceneGroup
  onNewColor: () => void
  onEditColor: (id: number) => void
  onDeleteColor: (id: number) => void
}

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3'

/** Static, dynamic and custom sections; each hides itself when the filter empties it. */
export default function SceneGrid({
  bulb,
  query,
  group,
  onNewColor,
  onEditColor,
  onDeleteColor
}: SceneGridProps) {
  const { t } = useTranslation()
  const { builtIn, custom } = useCatalog()
  const favoriteIds = useFavoriteIds()
  const setScene = useBulbStore((s) => s.setScene)
  const toggleFavoriteColor = useBulbStore((s) => s.toggleFavoriteColor)

  const filtering = query.trim() !== ''
  const visible = (entries: CatalogEntry[]) => entries.filter((e) => matches(e.name, query))
  const inGroup = (g: SceneGroup) => group === 'all' || group === g
  const statics = inGroup('static') ? visible(builtIn.filter((e) => e.group === 'static')) : []
  const dynamics = inGroup('dynamic') ? visible(builtIn.filter((e) => e.group === 'dynamic')) : []
  const colors = inGroup('custom') ? visible(custom) : []
  const nothing = statics.length + dynamics.length + colors.length === 0

  const renderTiles = (entries: CatalogEntry[]) => (
    <ul className={GRID}>
      {entries.map((entry) => (
        <li key={entry.id} className="min-w-0">
          <SceneTile
            entry={entry}
            active={bulb?.sceneId === entry.id}
            disabled={!bulb?.online}
            favorite={favoriteIds.includes(entry.id)}
            onApply={() => void setScene(entry.id, bulb?.ip)}
            onToggleFavorite={() => void toggleFavoriteColor(entry.id)}
            menuItems={
              entry.kind === 'color'
                ? [
                    { label: t('common.edit'), onSelect: () => onEditColor(entry.id) },
                    {
                      label: t('common.delete'),
                      destructive: true,
                      onSelect: () => onDeleteColor(entry.id)
                    }
                  ]
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  )

  const section = (key: string, title: string, entries: CatalogEntry[]) =>
    entries.length > 0 && (
      <section aria-labelledby={`scenes-${key}`} className="flex flex-col gap-3">
        <h2 id={`scenes-${key}`} className="text-lg font-semibold">
          {title}
        </h2>
        {renderTiles(entries)}
      </section>
    )

  if (filtering && nothing) {
    return (
      <p role="status" className="py-8 text-center text-sm text-muted">
        {t('scenes.notFound')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {section('static', t('scenes.tags.static'), statics)}
      {section('dynamic', t('scenes.tags.dynamic'), dynamics)}

      {inGroup('custom') && (!filtering || colors.length > 0) && (
        <section aria-labelledby="scenes-custom" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="scenes-custom" className="text-lg font-semibold">
              {t('scenes.tags.custom')}
            </h2>
            <Button size="dense" onClick={onNewColor}>
              <LuPlus size={14} aria-hidden />
              {t('scenes.color.new')}
            </Button>
          </div>
          {colors.length > 0 ? (
            renderTiles(colors)
          ) : (
            <EmptyState
              icon={<LuPalette size={24} aria-hidden />}
              title={t('scenes.color.emptyTitle')}
              description={t('scenes.color.emptyDescription')}
              actions={
                <Button variant="primary" onClick={onNewColor}>
                  {t('scenes.color.new')}
                </Button>
              }
            />
          )}
        </section>
      )}
    </div>
  )
}
