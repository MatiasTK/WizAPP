import BulbDetail from '@components/BulbDetail'
import BulbDot from '@components/BulbDot'
import BulbList from '@components/BulbList'
import { useBulbStatus } from '@components/BulbShortcut'
import AddDeviceModal from '@components/modals/AddDeviceModal'
import BulbDetailsModal from '@components/modals/BulbDetailsModal'
import EditNameModal from '@components/modals/EditNameModal'
import Page from '@components/Page'
import SortList from '@components/SortList'
import AlertDialog from '@components/ui/AlertDialog'
import Button from '@components/ui/Button'
import EmptyState from '@components/ui/EmptyState'
import Spinner from '@components/ui/Spinner'
import { useBulbStore } from '@renderer/context/BulbStore'
import { cn } from '@renderer/lib/cn'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowDownUp, LuCheck, LuLightbulbOff, LuPlus, LuPower, LuPowerOff } from 'react-icons/lu'
import { useNavigate } from 'react-router'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeIp = useBulbStore((s) => s.activeBulb?.ip ?? null)
  const isDiscovering = useBulbStore((s) => s.isDiscovering)
  const discoveryFailed = useBulbStore((s) => s.discoveryFailed)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const deleteBulb = useBulbStore((s) => s.deleteBulb)
  const setAllBulbs = useBulbStore((s) => s.setAllBulbs)
  const retryDiscovery = useBulbStore((s) => s.retryDiscovery)
  const setBulbsOrder = useBulbStore((s) => s.setBulbsOrder)
  const pushToast = useBulbStore((s) => s.pushToast)
  const status = useBulbStatus()

  const [sorting, setSorting] = useState(false)
  // The selected bulb follows the active one. Picking an offline bulb (which cannot become
  // active) holds until the active bulb changes, e.g. from the Scenes page.
  const [choice, setChoice] = useState<string | null>(null)
  const [seenActiveIp, setSeenActiveIp] = useState(activeIp)
  if (seenActiveIp !== activeIp) {
    setSeenActiveIp(activeIp)
    setChoice(null)
  }
  const [addOpen, setAddOpen] = useState(false)
  const [renameIp, setRenameIp] = useState<string | null>(null)
  const [detailsIp, setDetailsIp] = useState<string | null>(null)
  const [deleteIp, setDeleteIp] = useState<string | null>(null)

  const find = (ip: string | null) => bulbs.find((b) => b.ip === ip) ?? null
  const selected = find(choice) ?? find(activeIp) ?? bulbs[0] ?? null
  const deleteTarget = find(deleteIp)
  const anyOnline = bulbs.some((b) => b.online)
  const onlineCount = bulbs.filter((b) => b.online).length

  // Selecting a bulb also makes it the active one (sidebar, Scenes page) when it can answer.
  const handleSelect = (ip: string) => {
    setChoice(ip)
    if (ip !== activeIp && find(ip)?.online) void setActiveBulb(ip)
  }

  const handleAllScenes = (ip: string) => {
    void setActiveBulb(ip)
    navigate('/scenes')
  }

  const handleStartSorting = () => {
    setSorting(true)
  }

  const handleDoneSorting = () => {
    setSorting(false)
    pushToast('toast.orderSaved', 'success')
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
        icon={
          <span className="flex size-16 items-center justify-center rounded-full bg-sunken">
            <LuLightbulbOff size={30} aria-hidden />
          </span>
        }
        title={discoveryFailed ? t('home.notFoundTitle') : t('home.emptyTitle')}
        description={
          <>
            <p>{discoveryFailed ? t('home.notFoundDescription') : t('home.emptyDescription')}</p>
            {/* Open when a search just failed, when the checklist is what the user needs. */}
            <details open={discoveryFailed} className="mt-3 text-left">
              <summary className="cursor-pointer rounded-sm text-center font-semibold text-primary-text">
                {t('home.tipsTitle')}
              </summary>
              <ul className="mt-2 list-disc pl-5">
                <li>{t('home.tipNetwork')}</li>
                <li>{t('home.tipPower')}</li>
                <li>{t('home.tipFirewall')}</li>
              </ul>
            </details>
          </>
        }
        actions={
          <>
            <Button variant="primary" size="large" onClick={() => void retryDiscovery()}>
              {t('home.retrySearch')}
            </Button>
            <Button size="large" onClick={() => setAddOpen(true)}>
              {t('home.addByIp')}
            </Button>
          </>
        }
      />
    )
  }

  const dialogs = (
    <>
      <AddDeviceModal open={addOpen} onOpenChange={setAddOpen} />
      <EditNameModal bulb={find(renameIp)} onOpenChange={(open) => !open && setRenameIp(null)} />
      <BulbDetailsModal
        bulb={find(detailsIp)}
        onOpenChange={(open) => !open && setDetailsIp(null)}
      />
      <AlertDialog
        open={deleteIp !== null}
        onOpenChange={(open) => !open && setDeleteIp(null)}
        title={t('bulb.removeTitle', { name: deleteTarget?.name ?? '' })}
        description={t('bulb.removeMessage', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('bulb.removeConfirm')}
        onConfirm={() => {
          if (deleteIp) void deleteBulb(deleteIp)
          setDeleteIp(null)
        }}
      />
    </>
  )

  if (sorting) {
    return (
      <Page
        title={t('home.sortTitle')}
        subtitle={t('home.sortHint')}
        actions={
          <Button variant="primary" className="px-[18px]" onClick={handleDoneSorting}>
            <LuCheck size={16} strokeWidth={2.4} aria-hidden />
            {t('common.done')}
          </Button>
        }
      >
        <SortList
          aria-label={t('home.sortLabel')}
          className="max-w-[640px]"
          onReorder={(ips) => void setBulbsOrder(ips)}
          items={bulbs.map((bulb) => ({
            id: bulb.ip,
            name: bulb.name,
            visual: <BulbDot bulb={bulb} size={30} />,
            detail: (
              <span className={cn('text-xs', bulb.online ? 'text-muted' : 'text-danger-text')}>
                {status(bulb)}
              </span>
            )
          }))}
        />
      </Page>
    )
  }

  if (bulbs.length === 0) {
    return (
      <Page title={t('home.title')} subtitle={t('home.subtitle')}>
        {renderEmpty()}
        {dialogs}
      </Page>
    )
  }

  // With one bulb the list and the "all" actions would only repeat the detail, so they appear
  // from the second bulb on.
  const multiple = bulbs.length > 1

  // Master-detail that fits the window: from the @xl container width the header stays put and
  // only the list and the favorites scroll, each inside its own pane. Below @xl (narrower than
  // the app's minimum window) the panes stack and the page scrolls.
  return (
    <div className="@container min-h-full @xl:h-full">
      <div
        className={cn(
          'flex min-h-full w-full flex-col gap-4 px-6 pt-5 pb-5 @xl:h-full @6xl:px-8',
          // The header ends where the content does.
          multiple ? 'max-w-[90rem]' : 'max-w-[72rem]'
        )}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[-0.02em]">{t('home.title')}</h1>
            <p
              role="status"
              className="mt-0.5 flex items-center gap-2 text-[13px] text-muted tabular-nums"
            >
              {multiple
                ? t('home.subtitleCount', { online: onlineCount, total: bulbs.length })
                : t('home.subtitle')}
              {isDiscovering && (
                <>
                  <span aria-hidden>·</span>
                  <Spinner />
                  {t('home.searching')}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {multiple && (
              <>
                <Button
                  className="text-[13px]"
                  disabled={!anyOnline}
                  onClick={() => void setAllBulbs(true)}
                >
                  <LuPower size={15} aria-hidden />
                  {t('home.allOn')}
                </Button>
                <Button
                  className="text-[13px]"
                  disabled={!anyOnline}
                  onClick={() => void setAllBulbs(false)}
                >
                  <LuPowerOff size={15} aria-hidden />
                  {t('home.allOff')}
                </Button>
                <Button className="text-[13px]" onClick={handleStartSorting}>
                  <LuArrowDownUp size={15} aria-hidden />
                  {t('home.sort')}
                </Button>
              </>
            )}
            <Button variant="primary" className="text-[13px]" onClick={() => setAddOpen(true)}>
              <LuPlus size={16} aria-hidden />
              {t('home.add.entry')}
            </Button>
          </div>
        </header>

        <div
          className={cn(
            'grid min-h-0 grow gap-4 @xl:grid-rows-[minmax(0,1fr)] @xl:items-start',
            multiple
              ? '@xl:grid-cols-[13rem_minmax(0,1fr)] @4xl:grid-cols-[17rem_minmax(0,1fr)] @6xl:grid-cols-[19rem_minmax(0,68rem)]'
              : ''
          )}
        >
          {multiple && (
            <div className="min-h-0 overflow-y-auto rounded-lg border border-border bg-surface p-1.5 @xl:max-h-full">
              <BulbList bulbs={bulbs} selectedIp={selected?.ip ?? null} onSelect={handleSelect} />
            </div>
          )}

          {selected && (
            <BulbDetail
              key={selected.ip}
              bulb={selected}
              onRename={() => setRenameIp(selected.ip)}
              onDetails={() => setDetailsIp(selected.ip)}
              onRemove={() => setDeleteIp(selected.ip)}
              onAllScenes={() => handleAllScenes(selected.ip)}
            />
          )}
        </div>
      </div>

      {dialogs}
    </div>
  )
}
