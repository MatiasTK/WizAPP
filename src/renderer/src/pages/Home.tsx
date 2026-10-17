import BulbCard from '@components/BulbCard'
import BulbDot from '@components/BulbDot'
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
import { LuArrowDownUp, LuCheck, LuPlus, LuPower, LuPowerOff } from 'react-icons/lu'
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
  // By default the active bulb's card is open. Closing it (or opening another one) holds
  // until the active bulb changes, e.g. from the sidebar or by opening a card.
  const [choice, setChoice] = useState<{ ip: string | null } | null>(null)
  const [seenActiveIp, setSeenActiveIp] = useState(activeIp)
  if (seenActiveIp !== activeIp) {
    setSeenActiveIp(activeIp)
    setChoice(null)
  }
  const openIp = choice ? choice.ip : activeIp
  const [addOpen, setAddOpen] = useState(false)
  const [renameIp, setRenameIp] = useState<string | null>(null)
  const [detailsIp, setDetailsIp] = useState<string | null>(null)
  const [deleteIp, setDeleteIp] = useState<string | null>(null)

  const find = (ip: string | null) => bulbs.find((b) => b.ip === ip) ?? null
  const deleteTarget = find(deleteIp)
  const anyOnline = bulbs.some((b) => b.online)
  const onlineCount = bulbs.filter((b) => b.online).length

  // Opening a card also makes that bulb the active one (sidebar, Scenes page).
  const handleExpandedChange = (ip: string, expanded: boolean) => {
    setChoice({ ip: expanded ? ip : null })
    if (expanded) void setActiveBulb(ip)
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
    setChoice(null)
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

  return (
    <Page
      title={t('home.title')}
      subtitle={
        bulbs.length > 0
          ? t('home.subtitleCount', { online: onlineCount, total: bulbs.length })
          : t('home.subtitle')
      }
      actions={
        <>
          {bulbs.length > 1 && (
            <Button onClick={handleStartSorting}>
              <LuArrowDownUp size={16} aria-hidden />
              {t('home.sort')}
            </Button>
          )}
          <Button disabled={!anyOnline} onClick={() => void setAllBulbs(true)}>
            <LuPower size={16} aria-hidden />
            {t('home.allOn')}
          </Button>
          <Button disabled={!anyOnline} onClick={() => void setAllBulbs(false)}>
            <LuPowerOff size={16} aria-hidden />
            {t('home.allOff')}
          </Button>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <LuPlus size={16} strokeWidth={2.2} aria-hidden />
            {t('home.add.entry')}
          </Button>
        </>
      }
    >
      {bulbs.length === 0 ? (
        renderEmpty()
      ) : (
        <section
          aria-label={t('home.listLabel')}
          className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5"
        >
          {bulbs.map((bulb) => (
            <BulbCard
              key={bulb.ip}
              bulb={bulb}
              expanded={openIp === bulb.ip}
              onExpandedChange={(expanded) => handleExpandedChange(bulb.ip, expanded)}
              onRename={() => setRenameIp(bulb.ip)}
              onDetails={() => setDetailsIp(bulb.ip)}
              onRemove={() => setDeleteIp(bulb.ip)}
              onAllScenes={() => handleAllScenes(bulb.ip)}
            />
          ))}
        </section>
      )}
      {bulbs.length > 0 && isDiscovering && (
        <p role="status" className="flex items-center gap-2 text-[13px] text-muted">
          <Spinner />
          {t('home.searching')}
        </p>
      )}

      {dialogs}
    </Page>
  )
}
