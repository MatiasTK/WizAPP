import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import BulbRow from '@components/BulbRow'
import FavoriteScene from '@components/FavoriteScene'
import AddDeviceModal from '@components/modals/AddDeviceModal'
import EditNameModal from '@components/modals/EditNameModal'
import SceneChooser from '@components/modals/SceneChooser'
import AlertDialog from '@components/ui/AlertDialog'
import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import Spinner from '@components/ui/Spinner'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuLightbulb, LuLightbulbOff, LuPlus, LuPower, LuPowerOff } from 'react-icons/lu'
import { useNavigate } from 'react-router'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const isDiscovering = useBulbStore((s) => s.isDiscovering)
  const discoveryFailed = useBulbStore((s) => s.discoveryFailed)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const probeBulb = useBulbStore((s) => s.probeBulb)
  const deleteBulb = useBulbStore((s) => s.deleteBulb)
  const setAllBulbs = useBulbStore((s) => s.setAllBulbs)
  const retryDiscovery = useBulbStore((s) => s.retryDiscovery)
  const setBulbsOrder = useBulbStore((s) => s.setBulbsOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const ips = bulbs.map((b) => b.ip)
    const from = ips.indexOf(String(active.id))
    const to = ips.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    void setBulbsOrder(arrayMove(ips, from, to))
  }

  const [addOpen, setAddOpen] = useState(false)
  const [sceneIp, setSceneIp] = useState<string | null>(null)
  const [renameIp, setRenameIp] = useState<string | null>(null)
  const [deleteIp, setDeleteIp] = useState<string | null>(null)

  const sceneBulb = bulbs.find((b) => b.ip === sceneIp) ?? null
  const renameBulb = bulbs.find((b) => b.ip === renameIp) ?? null
  const deleteTarget = bulbs.find((b) => b.ip === deleteIp)
  const anyOnline = bulbs.some((b) => b.online)

  const handleDetails = (ip: string) => {
    void setActiveBulb(ip)
    navigate('/information')
  }

  const renderEmpty = () => {
    if (isDiscovering) {
      return (
        <EmptyState
          icon={<Spinner size={28} />}
          title={t('home.searching')}
          description={t('home.searchingHint')}
        />
      )
    }
    return (
      <EmptyState
        icon={<LuLightbulbOff size={28} aria-hidden />}
        title={discoveryFailed ? t('home.notFoundTitle') : t('home.emptyTitle')}
        description={
          <>
            <p>{discoveryFailed ? t('home.notFoundDescription') : t('home.emptyDescription')}</p>
            <ul className="mt-2 list-disc pl-5 text-left">
              <li>{t('home.tipNetwork')}</li>
              <li>{t('home.tipPower')}</li>
              <li>{t('home.tipFirewall')}</li>
            </ul>
          </>
        }
        actions={
          <>
            <Button variant="primary" onClick={() => void retryDiscovery()}>
              {t('home.retrySearch')}
            </Button>
            <Button onClick={() => setAddOpen(true)}>{t('home.addByIp')}</Button>
          </>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('home.title')}</h1>
          <p className="mt-1 text-base text-muted">{t('home.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!anyOnline} onClick={() => void setAllBulbs(true)}>
            <LuPower size={16} aria-hidden />
            {t('home.allOn')}
          </Button>
          <Button disabled={!anyOnline} onClick={() => void setAllBulbs(false)}>
            <LuPowerOff size={16} aria-hidden />
            {t('home.allOff')}
          </Button>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <LuPlus size={16} aria-hidden />
            {t('home.add.entry')}
          </Button>
        </div>
      </header>

      {bulbs.length === 0 ? (
        renderEmpty()
      ) : (
        <section aria-label={t('home.listLabel')}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
            accessibility={{ screenReaderInstructions: { draggable: t('bulb.dragInstructions') } }}
          >
            <SortableContext items={bulbs.map((b) => b.ip)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-3">
                {bulbs.map((bulb) => (
                  <BulbRow
                    key={bulb.ip}
                    bulb={bulb}
                    isActive={bulb.ip === activeBulb?.ip}
                    onSelect={() => void setActiveBulb(bulb.ip)}
                    onToggle={() => void toggleBulb(bulb.ip)}
                    onRetry={() => void probeBulb(bulb.ip)}
                    onOpenScenes={() => setSceneIp(bulb.ip)}
                    onRename={() => setRenameIp(bulb.ip)}
                    onDetails={() => handleDetails(bulb.ip)}
                    onDelete={() => setDeleteIp(bulb.ip)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {isDiscovering && (
            <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Spinner />
              {t('home.searching')}
            </p>
          )}
        </section>
      )}

      {bulbs.length > 0 && (
        <section aria-labelledby="home-favorites" className="flex flex-col gap-3">
          <div>
            <h2 id="home-favorites" className="flex items-center gap-2 text-lg font-semibold">
              <LuLightbulb size={16} aria-hidden />
              {t('scenes.favorites')}
            </h2>
            {activeBulb && (
              <p className="mt-0.5 text-sm text-muted">
                {t('home.favoritesFor', { name: activeBulb.name })}
              </p>
            )}
          </div>
          <FavoriteScene bulb={activeBulb} />
        </section>
      )}

      <AddDeviceModal open={addOpen} onOpenChange={setAddOpen} />
      <SceneChooser bulb={sceneBulb} onOpenChange={(open) => !open && setSceneIp(null)} />
      <EditNameModal bulb={renameBulb} onOpenChange={(open) => !open && setRenameIp(null)} />
      <AlertDialog
        open={deleteIp !== null}
        onOpenChange={(open) => !open && setDeleteIp(null)}
        title={t('bulb.deleteTitle')}
        description={t('bulb.deleteMessage', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('bulb.deleteConfirm')}
        onConfirm={() => {
          if (deleteIp) void deleteBulb(deleteIp)
          setDeleteIp(null)
        }}
      />
    </div>
  )
}
