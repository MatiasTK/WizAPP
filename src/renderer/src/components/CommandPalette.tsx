import BulbDot from '@components/BulbDot'
import Dialog from '@components/ui/Dialog'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { cn } from '@renderer/lib/cn'
import { matches } from '@renderer/lib/search'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LuPower, LuPowerOff, LuSearch } from 'react-icons/lu'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Command = {
  id: string
  label: string
  hint: string
  /** Swatch, bulb dot or action icon, 28 px. */
  visual: React.ReactNode
  run: () => void
}

const MAX_RESULTS = 30

const actionIcon = (icon: React.ReactNode) => (
  <span
    aria-hidden
    className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-sunken text-muted"
  >
    {icon}
  </span>
)
const LIST_ID = 'command-palette-list'

function Palette({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { all, favorites } = useCatalog()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const setScene = useBulbStore((s) => s.setScene)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const setAllBulbs = useBulbStore((s) => s.setAllBulbs)

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const commands = useMemo(() => {
    const sceneCommand = (entry: (typeof all)[number]): Command => ({
      id: `scene-${entry.id}`,
      label: entry.name,
      hint: t('palette.applyScene', { name: activeBulb?.name ?? '' }),
      visual: (
        <span
          aria-hidden
          className="size-7 shrink-0 rounded-sm border border-border"
          style={{ background: entry.swatch }}
        />
      ),
      run: () => void setScene(entry.id, activeBulb?.ip)
    })

    const scenes: Command[] = (query.trim() === '' ? favorites : all).map(sceneCommand)

    const bulbCommands: Command[] = bulbs.flatMap((b) => [
      {
        id: `select-${b.ip}`,
        label: b.name,
        hint: t('palette.selectBulb'),
        visual: <BulbDot bulb={b} size={28} />,
        run: () => void setActiveBulb(b.ip)
      },
      {
        id: `toggle-${b.ip}`,
        label: b.name,
        hint: b.state ? t('palette.turnOff') : t('palette.turnOn'),
        visual: actionIcon(b.state ? <LuPowerOff size={15} /> : <LuPower size={15} />),
        run: () => void toggleBulb(b.ip)
      }
    ])

    const allCommands: Command[] = [
      {
        id: 'all-on',
        label: t('home.allOn'),
        hint: t('palette.everyBulb'),
        visual: actionIcon(<LuPower size={15} />),
        run: () => void setAllBulbs(true)
      },
      {
        id: 'all-off',
        label: t('home.allOff'),
        hint: t('palette.everyBulb'),
        visual: actionIcon(<LuPowerOff size={15} />),
        run: () => void setAllBulbs(false)
      }
    ]

    // With an empty field: favorites first, then the quick actions.
    const pool = [...scenes, ...bulbCommands, ...allCommands]
    const visible =
      query.trim() === '' ? pool : pool.filter((c) => matches(`${c.label} ${c.hint}`, query))
    return visible.slice(0, MAX_RESULTS)
  }, [
    all,
    favorites,
    bulbs,
    activeBulb,
    query,
    t,
    setScene,
    setActiveBulb,
    toggleBulb,
    setAllBulbs
  ])

  const current = Math.min(index, Math.max(0, commands.length - 1))

  const execute = (command: Command | undefined) => {
    if (!command) return
    command.run()
    onClose()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex((current + 1) % Math.max(1, commands.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex((current - 1 + commands.length) % Math.max(1, commands.length))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setIndex(Math.max(0, commands.length - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      execute(commands[current])
    }
  }

  const activeId = commands[current] ? `palette-option-${commands[current].id}` : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-11 items-center gap-2.5 rounded-[12px] border-[1.5px] border-primary bg-surface px-3.5 text-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface">
        <LuSearch size={16} aria-hidden />
        <input
          role="combobox"
          aria-label={t('palette.label')}
          aria-expanded="true"
          aria-controls={LIST_ID}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          autoFocus
          autoComplete="off"
          value={query}
          placeholder={t('palette.placeholder')}
          onChange={(e) => {
            setQuery(e.target.value)
            setIndex(0)
          }}
          onKeyDown={handleKeyDown}
          className="h-full w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
        />
      </div>

      <p role="status" className="text-xs text-muted">
        {commands.length === 0
          ? t('palette.noResults')
          : t('palette.count', { count: commands.length })}
      </p>

      <ul
        id={LIST_ID}
        role="listbox"
        aria-label={t('palette.results')}
        className="flex max-h-80 flex-col gap-0.5 overflow-y-auto"
      >
        {commands.map((command, i) => (
          <li
            key={command.id}
            id={`palette-option-${command.id}`}
            role="option"
            aria-selected={i === current}
            onMouseMove={() => setIndex(i)}
            onClick={() => execute(command)}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2',
              i === current && 'bg-primary-soft'
            )}
          >
            {command.visual}
            <span className="min-w-0 grow truncate font-semibold">{command.label}</span>
            <span className="shrink-0 text-xs text-muted">{command.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('palette.title')}
      className="top-24 max-w-[560px] translate-y-0"
    >
      <Palette onClose={() => onOpenChange(false)} />
    </Dialog>
  )
}
