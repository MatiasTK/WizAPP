import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BrightnessSlider from '@components/ui/BrightnessSlider'
import Button from '@components/ui/Button'
import IconButton from '@components/ui/IconButton'
import Menu from '@components/ui/Menu'
import PowerButton from '@components/ui/PowerButton'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useCatalog } from '@renderer/lib/catalog'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import {
  LuEllipsisVertical,
  LuGripVertical,
  LuInfo,
  LuSquarePen,
  LuTrash,
  LuWifiOff
} from 'react-icons/lu'

type BulbRowProps = {
  bulb: BulbState
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
  onRetry: () => void
  onOpenScenes: () => void
  onRename: () => void
  onDetails: () => void
  onDelete: () => void
}

/** One card per bulb: every control acts on this bulb without selecting it first. */
export default function BulbRow({
  bulb,
  isActive,
  onSelect,
  onToggle,
  onRetry,
  onOpenScenes,
  onRename,
  onDetails,
  onDelete
}: BulbRowProps) {
  const { t } = useTranslation()
  const { byId } = useCatalog()
  const scene = bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined
  const offline = !bulb.online
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: bulb.ip })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'flex items-center gap-5 rounded-lg bg-surface px-5 py-4 ring-2 transition-shadow',
        isActive ? 'ring-primary' : 'ring-transparent',
        isDragging && 'relative z-10 opacity-80'
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t('bulb.reorder', { name: bulb.name })}
        className={cn(
          '-ml-3 flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg opacity-70 hover:opacity-100',
          focusRing
        )}
      >
        <LuGripVertical size={18} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-label={t('bulb.select', { name: bulb.name })}
        className={cn(
          '-ml-2 flex w-36 shrink-0 cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2 py-1 text-left',
          focusRing
        )}
      >
        <span className="w-full truncate text-base font-semibold">{bulb.name}</span>
        <span
          className={cn(
            'flex items-center gap-1.5 text-sm',
            offline ? 'text-danger-text' : 'text-muted'
          )}
        >
          {offline && <LuWifiOff size={14} aria-hidden />}
          {offline ? t('bulb.offlineLabel') : bulb.state ? t('bulb.on') : t('bulb.off')}
        </span>
      </button>

      <PowerButton label={bulb.name} isOn={bulb.state} disabled={offline} onToggle={onToggle} />

      <div className="min-w-24 grow">
        <BrightnessSlider ip={bulb.ip} name={bulb.name} dimming={bulb.dimming} disabled={offline} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {offline ? (
          <Button
            size="dense"
            variant="primary"
            onClick={onRetry}
            aria-label={t('bulb.retryFor', { name: bulb.name })}
          >
            {t('bulb.retry')}
          </Button>
        ) : (
          <Button
            variant="chip"
            size="dense"
            onClick={onOpenScenes}
            aria-label={t('bulb.chooseScene', {
              name: bulb.name,
              scene: scene?.name ?? t('bulb.noScene')
            })}
            className="max-w-36 gap-2"
          >
            {scene?.hex && (
              <span
                aria-hidden
                className="size-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: scene.hex }}
              />
            )}
            <span className="truncate">{scene?.name ?? t('bulb.noScene')}</span>
          </Button>
        )}

        <Menu
          trigger={
            <IconButton label={t('bulb.options', { name: bulb.name })} tooltip={false}>
              <LuEllipsisVertical size={18} aria-hidden />
            </IconButton>
          }
          items={[
            { label: t('bulb.rename'), icon: <LuSquarePen size={16} />, onSelect: onRename },
            { label: t('bulb.details'), icon: <LuInfo size={16} />, onSelect: onDetails },
            {
              label: t('bulb.delete'),
              icon: <LuTrash size={16} />,
              destructive: true,
              onSelect: onDelete
            }
          ]}
        />
      </div>
    </li>
  )
}
