import BrightnessSlider from '@components/ui/BrightnessSlider'
import PowerButton from '@components/ui/PowerButton'
import Select from '@components/ui/Select'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useTranslation } from 'react-i18next'

/** Active bulb card: pick which bulb the sidebar and the Scenes page act on. */
export default function BulbShortcut() {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const toggleBulb = useBulbStore((s) => s.toggleBulb)

  if (bulbs.length === 0) return null

  const status = (state: boolean, online: boolean) =>
    online ? (state ? t('bulb.on') : t('bulb.off')) : t('bulb.offlineLabel')

  const options = bulbs.map((b) => ({
    value: b.ip,
    label: `${b.name} · ${status(b.state, b.online)}`,
    shortLabel: b.name
  }))

  return (
    <section
      aria-label={t('sidebar.activeBulb')}
      className="flex shrink-0 flex-col gap-2 rounded-lg bg-raised p-3"
    >
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {t('sidebar.activeBulb')}
      </p>
      <Select
        aria-label={t('sidebar.activeBulb')}
        variant="ghost"
        value={activeBulb?.ip ?? ''}
        onValueChange={(ip) => void setActiveBulb(ip)}
        options={options}
        className="-mx-2 w-[calc(100%+1rem)] min-w-0 font-semibold"
      />
      {activeBulb && (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {status(activeBulb.state, activeBulb.online)}
            </span>
            <PowerButton
              size="sm"
              label={activeBulb.name}
              isOn={activeBulb.state}
              disabled={!activeBulb.online}
              onToggle={() => void toggleBulb(activeBulb.ip)}
            />
          </div>
          <BrightnessSlider
            ip={activeBulb.ip}
            name={activeBulb.name}
            dimming={activeBulb.dimming}
            disabled={!activeBulb.online}
          />
        </>
      )}
    </section>
  )
}
