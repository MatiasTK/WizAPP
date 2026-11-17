import ActiveBulbPicker, { useBulbStatus } from '@components/ActiveBulbPicker'
import { useBulbHex } from '@components/BulbDot'
import BrightnessSlider from '@components/ui/BrightnessSlider'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import Switch from '@components/ui/Switch'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useRetry } from '@renderer/hooks/useRetry'
import { useTranslation } from 'react-i18next'
import { LuWifiOff } from 'react-icons/lu'

/** "Active bulb" card of the sidebar: pick the bulb the sidebar and the Scenes page act on. */
export default function BulbShortcut() {
  const hasBulbs = useBulbStore((s) => s.bulbs.length > 0)
  const activeBulb = useBulbStore((s) => s.activeBulb)

  if (!hasBulbs || !activeBulb) return null
  return <ActiveBulbCard />
}

/** Body of the card; split out so the bulb-color hook only runs with a bulb to show. */
const ActiveBulbCard = () => {
  const { t } = useTranslation()
  const activeBulb = useBulbStore((s) => s.activeBulb)!
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const { retrying, retry } = useRetry(activeBulb.ip)
  const status = useBulbStatus()
  const hex = useBulbHex(activeBulb)
  const lit = activeBulb.online && activeBulb.state

  return (
    <section
      aria-label={t('sidebar.activeBulb')}
      className="flex shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-sunken p-3"
    >
      <h2 className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
        {t('sidebar.activeBulb')}
      </h2>

      <ActiveBulbPicker side="top" className="-mx-1.5 -mt-1" />

      {activeBulb.online ? (
        <>
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[13px] text-muted">{status(activeBulb)}</span>
            <Switch
              size="sm"
              label={t('bulb.power', { name: activeBulb.name })}
              isOn={activeBulb.state}
              color={hex}
              onToggle={() => void toggleBulb(activeBulb.ip)}
            />
          </div>
          <BrightnessSlider
            size="sm"
            ip={activeBulb.ip}
            name={activeBulb.name}
            dimming={activeBulb.dimming}
            color={lit ? hex : null}
            disabled={!lit}
          />
        </>
      ) : (
        // An offline bulb has no real state to show, so no stale switch or brightness value.
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex items-center gap-1.5 text-[13px] text-danger-text">
            <LuWifiOff size={14} aria-hidden />
            {status(activeBulb)}
          </span>
          <Button
            size="dense"
            variant="primary"
            disabled={retrying}
            onClick={() => void retry()}
            aria-label={t('bulb.retryFor', { name: activeBulb.name })}
          >
            {retrying && <Spinner />}
            {t('bulb.retry')}
          </Button>
        </div>
      )}
    </section>
  )
}
