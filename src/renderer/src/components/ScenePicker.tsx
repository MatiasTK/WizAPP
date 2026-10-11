import FavoriteScene from '@components/FavoriteScene'
import CustomColorModal from '@components/modals/CustomColorModal'
import SceneGrid, { type SceneGroup } from '@components/SceneGrid'
import SegmentedControl, { type Segment } from '@components/ui/SegmentedControl'
import AlertDialog from '@components/ui/AlertDialog'
import TextField from '@components/ui/TextField'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { matches } from '@renderer/lib/search'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuSearch } from 'react-icons/lu'

const GROUPS: SceneGroup[] = ['all', 'static', 'dynamic', 'custom']

type ScenePickerProps = {
  /** The bulb scenes are applied to. */
  bulb: BulbState | null
  /** Hidden in the per-bulb chooser dialog, which has little room. */
  showFavorites?: boolean
}

/** Filter field + favorites + sections, shared by the Scenes page and the chooser dialog. */
export default function ScenePicker({ bulb, showFavorites = true }: ScenePickerProps) {
  const { t } = useTranslation()
  const { byId, favorites } = useCatalog()
  const removeCustomColor = useBulbStore((s) => s.removeCustomColor)

  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<SceneGroup>('all')
  const [colorDialog, setColorDialog] = useState<{ open: boolean; id?: number }>({ open: false })
  const [deleting, setDeleting] = useState<number | null>(null)

  const editing = colorDialog.id !== undefined ? byId.get(colorDialog.id) : undefined
  const deletingEntry = deleting !== null ? byId.get(deleting) : undefined
  const showFavoriteSection =
    showFavorites &&
    group === 'all' &&
    (query.trim() === '' || favorites.some((f) => matches(f.name, query)))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl<SceneGroup>
          aria-label={t('scenes.groups')}
          value={group}
          onValueChange={setGroup}
          segments={GROUPS.map(
            (g): Segment<SceneGroup> => ({ value: g, label: t(`scenes.tags.${g}`) })
          )}
        />
        <TextField
          label={t('scenes.filter')}
          hideLabel
          icon={<LuSearch size={16} />}
          type="search"
          value={query}
          placeholder={t('scenes.filterPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="min-w-44 max-w-md flex-1"
        />
      </div>

      {showFavoriteSection && (
        <section aria-labelledby="scenes-favorites" className="flex flex-col gap-3">
          <h2 id="scenes-favorites" className="text-lg font-semibold">
            {t('scenes.favorites')}
          </h2>
          <FavoriteScene bulb={bulb} query={query} />
        </section>
      )}

      <SceneGrid
        bulb={bulb}
        query={query}
        group={group}
        onNewColor={() => setColorDialog({ open: true })}
        onEditColor={(id) => setColorDialog({ open: true, id })}
        onDeleteColor={setDeleting}
      />

      <CustomColorModal
        open={colorDialog.open}
        onOpenChange={(open) => setColorDialog((d) => ({ ...d, open }))}
        editing={
          editing && editing.hex
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
    </div>
  )
}
