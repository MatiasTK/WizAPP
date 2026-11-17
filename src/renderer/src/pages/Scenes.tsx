import ActiveBulbPicker from '@components/ActiveBulbPicker'
import BulbDot from '@components/BulbDot'
import CustomColorModal from '@components/modals/CustomColorModal'
import Page from '@components/Page'
import SceneTile from '@components/SceneTile'
import SortList from '@components/SortList'
import AlertDialog from '@components/ui/AlertDialog'
import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import InlineAlert from '@components/ui/InlineAlert'
import Spinner from '@components/ui/Spinner'
import SegmentedControl, { type Segment } from '@components/ui/SegmentedControl'
import Switch from '@components/ui/Switch'
import TextField from '@components/ui/TextField'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useOverlayStore } from '@renderer/context/OverlayStore'
import { useRetry } from '@renderer/hooks/useRetry'
import { bulbHex, useCatalog, type CatalogEntry } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { matches } from '@renderer/lib/search'
import { TINT } from '@renderer/lib/tint'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuArrowDownUp,
  LuCheck,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuUndo2
} from 'react-icons/lu'
import { Link, useLocation, useNavigate } from 'react-router'

export type SceneGroup = 'all' | 'static' | 'dynamic' | 'custom'

const GROUPS: { value: SceneGroup; label: string }[] = [
  { value: 'all', label: 'scenes.tags.all' },
  { value: 'static', label: 'scenes.tags.static' },
  { value: 'dynamic', label: 'scenes.tags.dynamic' },
  { value: 'custom', label: 'scenes.tags.custom' }
]

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3'

/** The active bulb is offline: why, and a Retry that shows it is trying and how it went. */
const OfflineNotice = ({ ip, name }: { ip: string; name: string }) => {
  const { t } = useTranslation()
  const { retrying, stillOffline, retry } = useRetry(ip)
  return (
    <InlineAlert
      tone="danger"
      action={
        <Button size="dense" variant="primary" disabled={retrying} onClick={() => void retry()}>
          {retrying && <Spinner />}
          {t('bulb.retry')}
        </Button>
      }
    >
      {stillOffline && <span className="font-semibold">{t('bulb.stillOffline')} </span>}
      {t('bulb.offline', { name })}
    </InlineAlert>
  )
}

export default function Scenes() {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const bulb = useBulbStore((s) => s.activeBulb)
  const setScene = useBulbStore((s) => s.setScene)
  const applyToAll = useBulbStore((s) => s.applyToAll)
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const toggleFavoriteColor = useBulbStore((s) => s.toggleFavoriteColor)
  const setFavoriteColorsOrder = useBulbStore((s) => s.setFavoriteColorsOrder)
  const removeCustomColor = useBulbStore((s) => s.removeCustomColor)
  const pushToast = useBulbStore((s) => s.pushToast)
  const addToast = useBulbStore((s) => s.addToast)
  const { all, byId, favorites } = useCatalog()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<SceneGroup>('all')
  const [sortingFavorites, setSortingFavorites] = useState(false)
  const [colorDialog, setColorDialog] = useState<{ open: boolean; id?: number }>({ open: false })
  const [deleting, setDeleting] = useState<number | null>(null)

  const nowHex = bulb?.online ? bulbHex(bulb, byId) : null
  const lit = !!bulb?.online && bulb.state
  const current = bulb && bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
  const editing = colorDialog.id !== undefined ? byId.get(colorDialog.id) : undefined
  const deletingEntry = deleting !== null ? byId.get(deleting) : undefined
  const showingDeleted = bulbs
    .filter((b) => b.online && b.state && b.sceneId === deleting)
    .map((b) => b.name)
  const filtering = query.trim() !== ''
  const showFavorites = group === 'all' && !filtering && favorites.length > 0
  // Favorites have their own section above, so the main grid does not list them again.
  const visible = all.filter(
    (e) =>
      (group === 'all' || e.group === group) &&
      matches(e.name, query) &&
      !(showFavorites && favorites.some((f) => f.id === e.id))
  )

  const gridTitle =
    group !== 'all'
      ? t(GROUPS.find((g) => g.value === group)!.label)
      : filtering
        ? t('scenes.results')
        : showFavorites
          ? t('scenes.moreScenes')
          : t('scenes.allScenes')

  const orderAtStart = useRef('')
  const [orderNow, setOrderNow] = useState('')
  // Like the bulbs sort mode: the focus goes to "Done" on the way in and back to "Sort".
  const focusAfterSort = useRef(false)
  useEffect(() => {
    if (!focusAfterSort.current) return
    const selector = sortingFavorites ? '[data-sort="done"]' : '[data-sort="start"]'
    window.setTimeout(() => document.querySelector<HTMLElement>(selector)?.focus(), 0)
  }, [sortingFavorites])

  const handleStartSorting = () => {
    focusAfterSort.current = true
    orderAtStart.current = favorites.map((f) => f.id).join()
    setOrderNow(orderAtStart.current)
    setSortingFavorites(true)
  }

  // Each move is saved as it happens; the toast only confirms that something changed.
  const handleDoneSorting = () => {
    setSortingFavorites(false)
    if (orderNow !== orderAtStart.current) {
      pushToast('toast.orderSaved', 'success')
    }
  }

  const handleUndoSorting = () => {
    // The last "moved to position N" no longer describes the list.
    useBulbStore
      .getState()
      .toasts.filter((toast) => toast.message === 'sort.movedTo')
      .forEach((toast) => useBulbStore.getState().dismissToast(toast.id))
    pushToast('toast.orderRestored', 'info')
    setOrderNow(orderAtStart.current)
    void setFavoriteColorsOrder(orderAtStart.current.split(',').map(Number))
  }

  useEffect(() => {
    if (!sortingFavorites) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (useOverlayStore.getState().depth > 0) return
      if (event.key === 'Escape') return handleDoneSorting()
      // Ctrl+Z here means the sort mode's own Undo, not the last toast's.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.stopPropagation()
        if (orderNow !== orderAtStart.current) handleUndoSorting()
      }
    }
    // Capture phase: a dialog closing on the same Esc has not lowered `depth` yet.
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  })

  const { state: intent } = useLocation() as { state: { intent?: string } | null }
  useEffect(() => {
    if (intent?.intent === 'newColor') setColorDialog({ open: true })
    if (intent?.intent === 'sortFavorites' && favorites.length > 1) handleStartSorting()
    if (!intent?.intent) return
    navigate('.', { replace: true, state: null })
  }, [intent, navigate])

  // The tile moves between "Favorites" and the grid; the focus follows its heart and the change
  // is announced (and shown) as a toast.
  const handleToggleFavorite = (entry: CatalogEntry) => {
    const wasFavorite = favorites.some((f) => f.id === entry.id)
    const orderBefore = favorites.map((f) => f.id)
    const hadFocus = document.activeElement?.getAttribute('data-favorite-for') === String(entry.id)
    void toggleFavoriteColor(entry.id).then(() => {
      if (wasFavorite) {
        // Removing one is undoable, back in the place it had among the favorites.
        addToast({
          id: crypto.randomUUID(),
          message: 'scenes.favorite.removed',
          type: 'success',
          autoDismiss: true,
          params: { name: entry.name },
          undo: () =>
            void toggleFavoriteColor(entry.id)
              .then(() => setFavoriteColorsOrder(orderBefore))
              .then(() => {
                // The heart moved back to Favorites; the focus goes with it.
                window.setTimeout(
                  () =>
                    document
                      .querySelector<HTMLElement>(`[data-favorite-for="${entry.id}"]`)
                      ?.focus(),
                  50
                )
              })
        })
      } else {
        pushToast('scenes.favorite.added', 'success', { name: entry.name })
      }
      if (hadFocus) {
        window.setTimeout(
          () => document.querySelector<HTMLElement>(`[data-favorite-for="${entry.id}"]`)?.focus(),
          50
        )
      }
    })
  }

  const renderTile = (entry: CatalogEntry) => (
    <li key={entry.id} className="min-w-0">
      <SceneTile
        entry={entry}
        // An offline or switched-off bulb shows no scene, so no stale check.
        active={lit && bulb?.sceneId === entry.id}
        disabled={!bulb?.online}
        favorite={favorites.some((f) => f.id === entry.id)}
        color={bulb?.online && bulb.state ? nowHex : null}
        applyLabel={
          bulb
            ? t(bulb.state ? 'bulb.applyTo' : 'bulb.applyToOff', {
                scene: entry.name,
                name: bulb.name
              })
            : undefined
        }
        onApply={() => void setScene(entry.id, bulb?.ip)}
        onToggleFavorite={() => handleToggleFavorite(entry)}
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
    if (bulb && !bulb.online) return <OfflineNotice ip={bulb.ip} name={bulb.name} />
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
      // When the name exists in another group, the filter is the problem, not the name.
      const elsewhere = group !== 'all' && all.some((e) => matches(e.name, query))
      return (
        <div role="status" className="flex flex-wrap items-center gap-3 text-muted">
          <p>
            {elsewhere
              ? t('scenes.notInGroup', { group: t(GROUPS.find((g) => g.value === group)!.label) })
              : t('scenes.notFound')}
          </p>
          {elsewhere && (
            <Button
              size="dense"
              onClick={() => {
                setGroup('all')
                // The button goes away with the message; keep the focus in the search field.
                document.querySelector<HTMLInputElement>('main input[type="search"]')?.focus()
              }}
            >
              {t('scenes.searchAll')}
            </Button>
          )}
        </div>
      )
    }
    return <ul className={GRID}>{visible.map(renderTile)}</ul>
  }

  return (
    <Page
      title={t('scenes.title')}
      actions={
        <Button onClick={() => setColorDialog({ open: true })}>
          <LuPlus size={16} strokeWidth={2.2} aria-hidden />
          {t('scenes.color.new')}
        </Button>
      }
    >
      {renderNotice()}

      {bulb && (
        // The bulb the page acts on, in its own light, with a picker to act on another one.
        <div
          // Stays in view while the grid scrolls, so the target of a tap is always visible.
          className="sticky top-0 z-10 -mx-6 -mt-5 bg-bg px-6 pt-5 pb-1"
        >
          <div
            className={cn(
              'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface py-2.5 pr-3 pl-4 transition-colors duration-300',
              lit && nowHex && TINT
            )}
            style={lit && nowHex ? ({ '--tint': nowHex } as CSSProperties) : undefined}
          >
            <BulbDot bulb={bulb} size={26} glow />
            <div className="flex min-w-0 grow flex-col items-start">
              {bulbs.length > 1 ? (
                <ActiveBulbPicker dot={false} className="-my-1 -ml-1.5 h-8 max-w-full" />
              ) : (
                <p className="truncate font-bold">{bulb.name}</p>
              )}
              <p
                role="status"
                className={cn(
                  'flex min-w-0 items-center gap-1.5 text-[13px]',
                  !bulb.online ? 'text-danger-text' : lit ? 'text-fg/75' : 'text-muted'
                )}
              >
                {current && lit && (
                  <span
                    aria-hidden
                    className="size-3.5 shrink-0 rounded-[4px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-fg)_20%,transparent)]"
                    style={{ background: current.swatch }}
                  />
                )}
                <span className="truncate">
                  {!bulb.online
                    ? t('bulb.offlineLabel')
                    : bulb.state
                      ? t('bulb.statusOn', {
                          scene: current?.name ?? t('bulb.on'),
                          value: bulb.dimming ?? 0
                        })
                      : t('bulb.off')}
                </span>
              </p>
            </div>
            {lit && current && bulbs.length > 1 && (
              <Button size="dense" onClick={() => current && void applyToAll(current.id)}>
                {t('scenes.applyToAll', { name: current.name })}
              </Button>
            )}
            {bulb.online && (
              <Switch
                label={t('bulb.power', { name: bulb.name })}
                isOn={bulb.state}
                color={nowHex}
                onToggle={() => void toggleBulb(bulb.ip)}
              />
            )}
          </div>
        </div>
      )}

      {!sortingFavorites && (
        <div className="flex flex-wrap items-center gap-3">
          <TextField
            label={t('scenes.filter')}
            hideLabel
            icon={<LuSearch size={15} />}
            type="search"
            value={query}
            placeholder={t('scenes.filterPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
            wrapperClassName="max-w-[360px] flex-[1_1_11rem]"
            className="h-[38px]"
          />
          <SegmentedControl<SceneGroup>
            aria-label={t('scenes.groups')}
            value={group}
            onValueChange={setGroup}
            segments={GROUPS.map(
              (g): Segment<SceneGroup> => ({ value: g.value, label: t(g.label) })
            )}
          />
        </div>
      )}

      {showFavorites && (
        <section aria-labelledby="scenes-favorites" className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <h2 id="scenes-favorites" className="grow text-base font-bold">
              {t('scenes.favorites')}
            </h2>
            {sortingFavorites && (
              <Button
                size="dense"
                disabled={orderNow === orderAtStart.current}
                onClick={handleUndoSorting}
              >
                <LuUndo2 size={14} aria-hidden />
                {t('common.undo')}
              </Button>
            )}
            {sortingFavorites ? (
              <Button
                data-sort="done"
                size="dense"
                variant="primary"
                className="px-3.5"
                onClick={handleDoneSorting}
              >
                <LuCheck size={14} strokeWidth={2.4} aria-hidden />
                {t('common.done')}
              </Button>
            ) : (
              favorites.length > 1 && (
                <Button data-sort="start" size="dense" onClick={handleStartSorting}>
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
                onReorder={(ids) => {
                  setOrderNow(ids.join())
                  void setFavoriteColorsOrder(ids)
                }}
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

      {!sortingFavorites && (
        <section aria-labelledby="scenes-grid" className="flex flex-col gap-2.5">
          <h2 id="scenes-grid" className="text-base font-bold">
            {gridTitle}
          </h2>
          {renderGrid()}
        </section>
      )}

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
        description={[
          t(
            favorites.some((f) => f.id === deleting)
              ? 'scenes.color.deleteMessageFavorite'
              : 'scenes.color.deleteMessage',
            { name: deletingEntry?.name ?? '' }
          ),
          // Deleting the color does not change the light a bulb is giving right now.
          showingDeleted.length > 0
            ? t('scenes.color.deleteKeepsLight', {
                count: showingDeleted.length,
                names: showingDeleted.join(', ')
              })
            : ''
        ]
          .filter(Boolean)
          .join(' ')}
        confirmLabel={t('scenes.color.deleteConfirm')}
        onConfirm={() => {
          if (deleting !== null) {
            void removeCustomColor(deleting)
            pushToast('scenes.color.deleted', 'success', { name: deletingEntry?.name ?? '' })
          }
          // The focus goes to the next color (or the previous one), the heading when none is left.
          const colors = all.filter((e) => e.kind === 'color')
          const index = colors.findIndex((e) => e.id === deleting)
          const neighbor = colors[index + 1] ?? colors[index - 1]
          setDeleting(null)
          window.setTimeout(
            () =>
              (
                (neighbor &&
                  document.querySelector<HTMLElement>(`[data-favorite-for="${neighbor.id}"]`)) ||
                document.querySelector<HTMLElement>('main h1')
              )?.focus({ preventScroll: true }),
            50
          )
        }}
      />
    </Page>
  )
}
