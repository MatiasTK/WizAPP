import IconButton from '@components/ui/IconButton'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBulbStore } from '@renderer/context/BulbStore'
import { cn } from '@renderer/lib/cn'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowDown, LuArrowUp, LuGripVertical } from 'react-icons/lu'

export type SortItem<T extends string | number> = {
  id: T
  name: string
  /** Dot or swatch shown before the name. */
  visual: ReactNode
  /** Second line under the name (a bulb's status). */
  detail?: ReactNode
}

type SortListProps<T extends string | number> = {
  items: SortItem<T>[]
  /** Called with the full new order after every move. */
  onReorder: (ids: T[]) => void
  'aria-label': string
  className?: string
}

/** New order after moving the item at `from` to `to`; `null` if nothing moves. */
export const moveItem = <T,>(ids: T[], from: number, to: number): T[] | null => {
  if (from < 0 || to < 0 || from >= ids.length || to >= ids.length || from === to) return null
  return arrayMove(ids, from, to)
}

// Moves are announced through the toast region; dnd-kit's own messages would read ids.
const SILENT = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined
}

function SortRow<T extends string | number>({
  item,
  position,
  count,
  onMove
}: {
  item: SortItem<T>
  position: number
  count: number
  onMove: (to: number) => void
}) {
  const { t } = useTranslation()
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  })

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex cursor-grab touch-none items-center gap-3 rounded-[12px] py-2 pr-2 pl-3 hover:bg-sunken',
        isDragging && 'relative z-10 cursor-grabbing bg-sunken opacity-80 shadow-lg'
      )}
    >
      <LuGripVertical size={16} aria-hidden className="shrink-0 text-muted" />
      <span aria-hidden className="w-5 shrink-0 text-[13px] text-muted tabular-nums">
        {position + 1}
      </span>
      {item.visual}
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate font-semibold">{item.name}</span>
        {item.detail}
      </span>
      {/* The buttons are the keyboard path; dragging is pointer only. */}
      <IconButton
        tone="outline"
        tooltip={false}
        label={t('sort.moveUp', { name: item.name })}
        disabled={position === 0}
        onClick={() => onMove(position - 1)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <LuArrowUp size={16} aria-hidden />
      </IconButton>
      <IconButton
        tone="outline"
        tooltip={false}
        label={t('sort.moveDown', { name: item.name })}
        disabled={position === count - 1}
        onClick={() => onMove(position + 1)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <LuArrowDown size={16} aria-hidden />
      </IconButton>
    </li>
  )
}

/** Numbered list of the "Sort" mode, shared by bulbs and favorites. */
export default function SortList<T extends string | number>({
  items,
  onReorder,
  className,
  'aria-label': ariaLabel
}: SortListProps<T>) {
  const addToast = useBulbStore((s) => s.addToast)
  const dismissToast = useBulbStore((s) => s.dismissToast)
  const lastToast = useRef<string | null>(null)

  // Leaving the sort mode replaces the last move announcement (with "Order saved").
  useEffect(
    () => () => {
      if (lastToast.current) dismissToast(lastToast.current)
    },
    [dismissToast]
  )

  // The new order shows at once; the backend's next update confirms it.
  // A new order from the backend replaces the local one.
  const incoming = items.map((i) => i.id)
  const key = incoming.join('|')
  const [local, setLocal] = useState({ key, ids: incoming })
  const current = local.key === key ? local.ids : incoming

  const byId = new Map(items.map((i) => [i.id, i]))
  const rows = current.map((id) => byId.get(id)).filter((i): i is SortItem<T> => !!i)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const move = (from: number, to: number) => {
    const next = moveItem(current, from, to)
    if (!next) return
    setLocal({ key, ids: next })
    onReorder(next)

    // One announcement at a time, so a few quick moves do not pile up toasts.
    if (lastToast.current) dismissToast(lastToast.current)
    const id = crypto.randomUUID()
    lastToast.current = id
    addToast({
      id,
      message: 'sort.movedTo',
      type: 'success',
      autoDismiss: true,
      params: { name: rows[from].name, position: to + 1 }
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    move(current.indexOf(active.id as T), current.indexOf(over.id as T))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: SILENT }}
    >
      <SortableContext items={current} strategy={verticalListSortingStrategy}>
        <ol
          aria-label={ariaLabel}
          className={cn(
            'flex flex-col gap-1 rounded-lg border border-border bg-surface p-1.5',
            className
          )}
        >
          {rows.map((item, index) => (
            <SortRow
              key={item.id}
              item={item}
              position={index}
              count={rows.length}
              onMove={(to) => move(index, to)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
