import BulbDot from '@components/BulbDot'
import CustomColorModal from '@components/modals/CustomColorModal'
import Page from '@components/Page'
import SceneTile from '@components/SceneTile'
import SortList from '@components/SortList'
import AlertDialog from '@components/ui/AlertDialog'
import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import InlineAlert from '@components/ui/InlineAlert'
import SegmentedControl, { type Segment } from '@components/ui/SegmentedControl'
import TextField from '@components/ui/TextField'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog, type CatalogEntry } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { matches } from '@renderer/lib/search'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowDownUp, LuCheck, LuPencil, LuPlus, LuSearch, LuTrash2 } from 'react-icons/lu'
import { Link } from 'react-router'

export type SceneGroup = 'all' | 'static' | 'dynamic' | 'custom'

const GROUPS: { value: SceneGroup; label: string }[] = [
  { value: 'all', label: 'scenes.tags.all' },
  { value: 'static', label: 'scenes.tags.static' },
  { value: 'dynamic', label: 'scenes.tags.dynamic' },
  { value: 'custom', label: 'scenes.tags.custom' }
]

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3'

export default function Scenes() {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const bulb = useBulbStore((s) => s.activeBulb)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const setScene = useBulbStore((s) => s.setScene)
  const applyToAll = useBulbStore((s) => s.applyToAll)
  const probeBulb = useBulbStore((s) => s.probeBulb)
  const toggleFavoriteColor = useBulbStore((s) => s.toggleFavoriteColor)
  const setFavoriteColorsOrder = useBulbStore((s) => s.setFavoriteColorsOrder)
  const removeCustomColor = useBulbStore((s) => s.removeCustomColor)
  const pushToast = useBulbStore((s) => s.pushToast)
  const { all, byId, favorites } = useCatalog()

  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<SceneGroup>('all')
  const [sortingFavorites, setSortingFavorites] = useState(false)
  const [colorDialog, setColorDialog] = useState<{ open: boolean; id?: number }>({ open: false })
  const [deleting, setDeleting] = useState<number | null>(null)

  const current = bulb && bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
  const editing = colorDialog.id !== undefined ? byId.get(colorDialog.id) : undefined
  const deletingEntry = deleting !== null ? byId.get(deleting) : undefined
  const filtering = query.trim() !== ''
  const visible = all.filter(
    (e) => (group === 'all' || e.group === group) && matches(e.name, query)
  )
  const showFavorites = group === 'all' && !filtering && favorites.length > 0

  const gridTitle =
    group !== 'all'
      ? t(GROUPS.find((g) => g.value === group)!.label)
      : filtering
        ? t('scenes.results')
        : t('scenes.allScenes')

  const handleDoneSorting = () => {
    setSortingFavorites(false)
    pushToast('toast.orderSaved', 'success')
  }

  const renderTile = (entry: CatalogEntry) => (
    <li key={entry.id} className="min-w-0">
      <SceneTile
        entry={entry}
        active={bulb?.sceneId === entry.id}
        disabled={!bulb?.online}
        favorite={favorites.some((f) => f.id === entry.id)}
        onApply={() => void setScene(entry.id, bulb?.ip)}
        onToggleFavorite={() => void toggleFavoriteColor(entry.id)}
        menuItems={
          entry.kind === 'color'
            ? [
                {
                  label: t('common.edit'),
                  icon: <LuPencil size={15} />,
                  onSelect: () => setColorDialog({ open: true, id: entry.id })
                },
                {
                  label: t('common.delete'),
                  icon: <LuTrash2 size={15} />,
                  destructive: true,
                  onSelect: () => setDeleting(entry.id)
                }
              ]
            : undefined
        }
      />
    </li>
  )

  const renderNotice = () => {
    if (bulbs.length === 0) {
      return (
        <InlineAlert
          tone="warning"
          action={
            <Link
              to="/"
              className={cn(
                'rounded-sm text-[13px] font-semibold text-primary-text underline underline-offset-2',
                focusRing
              )}
            >
              {t('scenes.goToBulbs')}
            </Link>
          }
        >
          {t('scenes.noBulbs')}
        </InlineAlert>
      )
    }
    if (bulb && !bulb.online) {
      return (
        <InlineAlert
          tone="danger"
          action={
            <Button size="dense" onClick={() => void probeBulb(bulb.ip)}>
              {t('bulb.retry')}
            </Button>
          }
        >
          {t('bulb.offline', { name: bulb.name })}
        </InlineAlert>
      )
    }
    return null
  }

  const renderGrid = () => {
    if (group === 'custom' && !filtering && visible.length === 0) {
      return (
        <EmptyState
          title={t('scenes.color.emptyTitle')}
          description={t('scenes.color.emptyDescription')}
          actions={
            <Button variant="primary" size="large" onClick={() => setColorDialog({ open: true })}>
              {t('scenes.color.new')}
            </Button>
          }
        />
      )
    }
    if (visible.length === 0) {
      return (
        <p role="status" className="text-muted">
          {t('scenes.notFound')}
        </p>
      )
    }
    return <ul className={GRID}>{visible.map(renderTile)}</ul>
  }

  return (
    <Page
      title={t('scenes.title')}
      subtitle={bulb ? t('scenes.subtitleFor', { name: bulb.name }) : t('scenes.noBulbs')}
      actions={
        <>
          <Button
            disabled={!current || !bulb?.online || bulbs.length < 2}
            onClick={() => current && void applyToAll(current.id)}
          >
            {current ? t('scenes.applyToAll', { name: current.name }) : t('scenes.applyToAllEmpty')}
          </Button>
          <Button variant="primary" onClick={() => setColorDialog({ open: true })}>
            <LuPlus size={16} strokeWidth={2.2} aria-hidden />
            {t('scenes.color.new')}
          </Button>
        </>
      }
    >
      {renderNotice()}

      {bulbs.length > 1 && (
        <div role="group" aria-label={t('scenes.target')} className="flex flex-wrap gap-2">
          {bulbs.map((b) => {
            const selected = b.ip === bulb?.ip
            return (
              <button
                key={b.ip}
                type="button"
                aria-pressed={selected}
                disabled={!b.online && !selected}
                onClick={() => void setActiveBulb(b.ip)}
                className={cn(
                  'flex h-[38px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] pr-3.5 pl-2 text-[13px] font-semibold transition-colors',
                  selected
                    ? 'border-primary bg-primary-soft text-primary-text'
                    : 'border-outline bg-surface text-fg hover:bg-raised',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  focusRing
                )}
              >
                <BulbDot bulb={b} size={22} />
                {b.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <TextField
          label={t('scenes.filter')}
          hideLabel
          icon={<LuSearch size={15} />}
          type="search"
          value={query}
          placeholder={t('scenes.filterPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="max-w-[360px] flex-[1_1_260px]"
          className="h-[38px]"
        />
        <SegmentedControl<SceneGroup>
          aria-label={t('scenes.groups')}
          value={group}
          onValueChange={setGroup}
          segments={GROUPS.map((g): Segment<SceneGroup> => ({ value: g.value, label: t(g.label) }))}
        />
      </div>

      {showFavorites && (
        <section aria-labelledby="scenes-favorites" className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <h2 id="scenes-favorites" className="grow text-base font-bold">
              {t('scenes.favorites')}
            </h2>
            {sortingFavorites ? (
              <Button size="dense" variant="primary" className="px-3.5" onClick={handleDoneSorting}>
                <LuCheck size={14} strokeWidth={2.4} aria-hidden />
                {t('common.done')}
              </Button>
            ) : (
              favorites.length > 1 && (
                <Button size="dense" onClick={() => setSortingFavorites(true)}>
                  <LuArrowDownUp size={14} aria-hidden />
                  {t('scenes.sort')}
                </Button>
              )
            )}
          </div>
          {sortingFavorites ? (
            <>
              <p className="text-[13px] text-muted">{t('scenes.sortHint')}</p>
              <SortList
                aria-label={t('scenes.sortLabel')}
                className="max-w-[560px]"
                onReorder={(ids) => void setFavoriteColorsOrder(ids)}
                items={favorites.map((entry) => ({
                  id: entry.id,
                  name: entry.name,
                  visual: (
                    <span
                      aria-hidden
                      className="size-8 shrink-0 rounded-sm"
                      style={{ background: entry.swatch }}
                    />
                  )
                }))}
              />
            </>
          ) : (
            <ul className={GRID}>{favorites.map(renderTile)}</ul>
          )}
        </section>
      )}

      <section aria-labelledby="scenes-grid" className="flex flex-col gap-2.5">
        <h2 id="scenes-grid" className="text-base font-bold">
          {gridTitle}
        </h2>
        {renderGrid()}
      </section>

      <CustomColorModal
        open={colorDialog.open}
        onOpenChange={(open) => setColorDialog((d) => ({ ...d, open }))}
        editing={
          editing?.kind === 'color'
            ? { id: editing.id, name: editing.name, hex: editing.hex }
            : undefined
        }
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('scenes.color.deleteTitle')}
        description={t('scenes.color.deleteMessage', { name: deletingEntry?.name ?? '' })}
        confirmLabel={t('scenes.color.deleteConfirm')}
        onConfirm={() => {
          if (deleting !== null) void removeCustomColor(deleting)
          setDeleting(null)
        }}
      />
    </Page>
  )
}
