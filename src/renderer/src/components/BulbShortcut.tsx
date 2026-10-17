import BulbDot from '@components/BulbDot'
import BrightnessSlider from '@components/ui/BrightnessSlider'
import Switch from '@components/ui/Switch'
import * as RadixSelect from '@radix-ui/react-select'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useBulbStore } from '@renderer/context/BulbStore'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuChevronsUpDown } from 'react-icons/lu'

/** "On" / "Off" / "Not responding" for one bulb. */
export const useBulbStatus = () => {
  const { t } = useTranslation()
  return (bulb: BulbState) =>
    bulb.online ? (bulb.state ? t('bulb.on') : t('bulb.off')) : t('bulb.offlineLabel')
}

/** "Active bulb" card of the sidebar: pick the bulb the sidebar and the Scenes page act on. */
export default function BulbShortcut() {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const status = useBulbStatus()

  if (bulbs.length === 0 || !activeBulb) return null

  return (
    <section
      aria-label={t('sidebar.activeBulb')}
      className="flex shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-sunken p-3"
    >
      <h2 className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
        {t('sidebar.activeBulb')}
      </h2>

      <RadixSelect.Root value={activeBulb.ip} onValueChange={(ip) => void setActiveBulb(ip)}>
        <RadixSelect.Trigger
          aria-label={t('sidebar.chooseActiveBulb')}
          className={cn(
            '-mx-1.5 -mt-1 flex h-9 min-w-0 cursor-pointer items-center gap-2.5 rounded-sm px-1.5 text-left text-fg transition-colors hover:bg-raised',
            focusRing
          )}
        >
          <BulbDot bulb={activeBulb} size={14} />
          <span className="min-w-0 grow truncate font-bold">
            <RadixSelect.Value>{activeBulb.name}</RadixSelect.Value>
          </span>
          <RadixSelect.Icon>
            <LuChevronsUpDown size={14} aria-hidden />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            side="top"
            sideOffset={6}
            className="z-(--z-menu) w-(--radix-select-trigger-width) min-w-52 rounded-[12px] border border-border bg-surface p-1 shadow-[0_12px_32px_rgb(0_0_0/0.2)]"
          >
            <RadixSelect.Viewport>
              {bulbs.map((bulb) => (
                <RadixSelect.Item
                  key={bulb.ip}
                  value={bulb.ip}
                  disabled={!bulb.online}
                  className={cn(
                    'flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-fg outline-none',
                    'data-highlighted:bg-raised data-[state=checked]:bg-primary-soft',
                    'data-disabled:cursor-not-allowed data-disabled:opacity-50'
                  )}
                >
                  <BulbDot bulb={bulb} size={12} />
                  <span className="min-w-0 grow truncate font-semibold">
                    <RadixSelect.ItemText>{bulb.name}</RadixSelect.ItemText>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{status(bulb)}</span>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      <div className="flex items-center justify-between gap-2.5">
        <span className={cn('text-[13px]', activeBulb.online ? 'text-muted' : 'text-danger-text')}>
          {status(activeBulb)}
        </span>
        <Switch
          size="sm"
          label={t('bulb.power', { name: activeBulb.name })}
          isOn={activeBulb.state && activeBulb.online}
          disabled={!activeBulb.online}
          onToggle={() => void toggleBulb(activeBulb.ip)}
        />
      </div>
      <BrightnessSlider
        size="sm"
        ip={activeBulb.ip}
        name={activeBulb.name}
        dimming={activeBulb.dimming}
        disabled={!activeBulb.online}
      />
    </section>
  )
}
