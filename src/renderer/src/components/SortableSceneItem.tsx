import SceneTile, { type SceneTileProps } from '@components/SceneTile'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, focusRing } from '@renderer/lib/cn'
import { useTranslation } from 'react-i18next'
import { LuGripVertical } from 'react-icons/lu'

type SortableSceneItemProps = Omit<SceneTileProps, 'handle'>

/** A favorite tile that can be reordered by dragging the handle or with the keyboard. */
export default function SortableSceneItem(props: SortableSceneItemProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.entry.id })

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t('scenes.favorite.reorder', { name: props.entry.name })}
      className={cn(
        'flex h-full w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg opacity-70 hover:opacity-100',
        focusRing
      )}
    >
      <LuGripVertical size={18} aria-hidden />
    </button>
  )

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('min-w-0', isDragging && 'relative z-10 opacity-80')}
    >
      <SceneTile {...props} handle={handle} />
    </li>
  )
}
