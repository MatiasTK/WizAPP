import BulbDot from '@components/BulbDot'
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

type ActiveBulbPickerProps = {
  /** Where the list opens: above in the sidebar (its card sits at the bottom), below elsewhere. */
  side?: 'top' | 'bottom'
  /** Hide the dot when the surrounding UI already shows the bulb's color. */
  dot?: boolean
  className?: string
}

/** Pick the active bulb: the one the sidebar card, the Scenes page and the tray act on. */
export default function ActiveBulbPicker({
  side = 'bottom',
  dot = true,
  className
}: ActiveBulbPickerProps) {
  const { t } = useTranslation()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const status = useBulbStatus()

  if (!activeBulb) return null

  return (
    <RadixSelect.Root value={activeBulb.ip} onValueChange={(ip) => void setActiveBulb(ip)}>
      <RadixSelect.Trigger
        // The visible name is part of the accessible one (label in name).
        aria-label={t('sidebar.activeBulbIs', { name: activeBulb.name })}
        className={cn(
          'flex h-9 min-w-0 cursor-pointer items-center gap-2.5 rounded-sm px-1.5 text-left text-fg transition-colors hover:bg-raised',
          focusRing,
          // Inside its own box: in the Scenes banner an outer ring would cover the line below.
          'focus-visible:ring-offset-0',
          className
        )}
      >
        {dot && <BulbDot bulb={activeBulb} size={14} />}
        <span className="min-w-0 grow truncate font-bold">
          <RadixSelect.Value>{activeBulb.name}</RadixSelect.Value>
        </span>
        <RadixSelect.Icon className="shrink-0 text-muted">
          <LuChevronsUpDown size={14} aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          side={side}
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
  )
}
