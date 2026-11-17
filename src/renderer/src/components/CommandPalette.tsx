import BulbDot from '@components/BulbDot'
import Dialog from '@components/ui/Dialog'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { cn } from '@renderer/lib/cn'
import { matches, normalizeText } from '@renderer/lib/search'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuArrowDownUp,
  LuCircleHelp,
  LuInfo,
  LuLanguages,
  LuLightbulb,
  LuMonitor,
  LuMoon,
  LuPalette,
  LuPlus,
  LuPower,
  LuPowerOff,
  LuRefreshCw,
  LuSearch,
  LuSettings,
  LuSun,
  LuSunMedium
} from 'react-icons/lu'
import { useNavigate } from 'react-router'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSettings: () => void
  onOpenHelp: () => void
}

type Command = {
  id: string
  label: string
  hint: string
  /** Swatch, bulb dot or action icon, 28 px. */
  visual: React.ReactNode
  run: () => void
  /** Text matched besides the label. Scenes leave it out: their hint names the active bulb. */
  keywords?: string
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

type PaletteProps = {
  onClose: () => void
  onOpenSettings: () => void
  onOpenHelp: () => void
}

function Palette({ onClose, onOpenSettings, onOpenHelp }: PaletteProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { all, favorites } = useCatalog()
  const bulbs = useBulbStore((s) => s.bulbs)
  const activeBulb = useBulbStore((s) => s.activeBulb)
  const setScene = useBulbStore((s) => s.setScene)
  const setActiveBulb = useBulbStore((s) => s.setActiveBulb)
  const toggleBulb = useBulbStore((s) => s.toggleBulb)
  const setBrightness = useBulbStore((s) => s.setBrightness)
  const setPower = useBulbStore((s) => s.setPower)
  const reconnect = useBulbStore((s) => s.reconnect)
  const probeBulb = useBulbStore((s) => s.probeBulb)
  const probeAll = useBulbStore((s) => s.probeAll)
  const setAllBulbs = useBulbStore((s) => s.setAllBulbs)
  const setTheme = useBulbStore((s) => s.setTheme)
  const setLanguage = useBulbStore((s) => s.setLanguage)
  const settings = useBulbStore((s) => s.settings)

  const pushToast = useBulbStore((s) => s.pushToast)
  // The palette closes and the change may happen to a bulb that is not on screen: say what it did.
  const confirm = (key: string, params: Record<string, string | number>) =>
    pushToast(key, 'success', params)

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const results = useMemo(() => {
    // Every word has to appear, in any order: "brillo living" finds Living room's brightness.
    // "%" splits too, so "30%" reads as "30" like the label's "30 %".
    const words = normalizeText(query)
      .split(/[\s%]+/)
      .filter(Boolean)
    const sceneCommand = (entry: (typeof all)[number]): Command => ({
      id: `scene-${entry.id}`,
      label: entry.name,
      hint: t(activeBulb?.state === false ? 'palette.applySceneOff' : 'palette.applyScene', {
        name: activeBulb?.name ?? ''
      }),
      visual: (
        <span
          aria-hidden
          className="size-7 shrink-0 rounded-sm border border-border"
          style={{ background: entry.swatch }}
        />
      ),
      run: () => {
        void setScene(entry.id, activeBulb?.ip)
        confirm('palette.done.scene', { scene: entry.name, name: activeBulb?.name ?? '' })
      },
      keywords: ''
    })

    const searching = query.trim() !== ''
    const scenes: Command[] = (searching ? all : favorites).map(sceneCommand)
    // "fiesta bedroom": a scene for a named bulb (the active one included), found only when the
    // query names both, so typing a bulb's name alone does not list every scene for it.
    const otherBulbScenes: Command[] = searching
      ? bulbs
          .filter((b) => b.online)
          .flatMap((b) =>
            all.map((entry) => ({
              ...sceneCommand(entry),
              id: `scene-${entry.id}-${b.ip}`,
              hint: t(b.state ? 'palette.applyScene' : 'palette.applySceneOff', { name: b.name }),
              keywords: b.name,
              run: () => {
                void setScene(entry.id, b.ip)
                confirm('palette.done.scene', { scene: entry.name, name: b.name })
              }
            }))
          )
          .filter(
            (c) =>
              // A real mention of the bulb: a word of 3+ letters in its name, not the scene's.
              words.some(
                (w) =>
                  w.length >= 3 &&
                  normalizeText(c.keywords).includes(w) &&
                  !normalizeText(c.label).includes(w)
              ) &&
              // And of the scene.
              words.some((w) =>
                normalizeText(c.label)
                  .split(/\s+/)
                  .some((x) => x.startsWith(w))
              )
          )
      : []

    // One row per bulb: switching it on or off is what people come for. Making it the active
    // bulb only shows up when they type, so the empty list does not name every bulb twice.
    const online = bulbs.filter((b) => b.online)
    const bulbCommands: Command[] = [
      ...online.map((b) => ({
        id: `toggle-${b.ip}`,
        label: b.name,
        hint: b.state ? t('palette.turnOff') : t('palette.turnOn'),
        visual: <BulbDot bulb={b} size={28} />,
        run: () => {
          void toggleBulb(b.ip)
          confirm(b.state ? 'palette.done.off' : 'palette.done.on', { name: b.name })
        }
      })),
      // An offline bulb still answers to its name: the only thing to do is try it again.
      ...(searching
        ? bulbs
            .filter((b) => !b.online)
            .map((b) => ({
              id: `retry-${b.ip}`,
              label: b.name,
              hint: t('palette.offlineRetry'),
              visual: <BulbDot bulb={b} size={28} />,
              run: () => void probeBulb(b.ip)
            }))
        : []),
      ...(searching
        ? online
            .filter((b) => b.ip !== activeBulb?.ip)
            .map((b) => ({
              id: `select-${b.ip}`,
              label: b.name,
              hint: t('palette.selectBulb'),
              visual: <BulbDot bulb={b} size={28} />,
              run: () => void setActiveBulb(b.ip)
            }))
        : [])
    ]

    // Brightness for every lit bulb, the active one first ("brillo living" narrows it down).
    const lit = online
      .slice()
      .sort((a, b) => Number(b.ip === activeBulb?.ip) - Number(a.ip === activeBulb?.ip))
    // A number typed in the query ("living 80", "30%") is offered as is, between 10 and 100.
    const typed = words.map((w) => Number(w.replace('%', ''))).find((n) => n >= 10 && n <= 100)
    const values = typed !== undefined ? [Math.round(typed)] : [25, 50, 75, 100]
    const brightnessCommands: Command[] = searching
      ? lit.flatMap((b) =>
          values.map((value) => ({
            id: `brightness-${b.ip}-${value}`,
            label: t('palette.brightness', { value }),
            hint: b.state
              ? t('palette.brightnessHint', { name: b.name })
              : t('palette.brightnessHintOff', { name: b.name }),
            visual: actionIcon(<LuSun size={15} />),
            run: () => {
              // An off bulb has no brightness to change; switch it on first.
              if (!b.state) void setPower(true, b.ip)
              void setBrightness(value, b.ip)
              confirm('palette.done.brightness', { name: b.name, value })
            }
          }))
        )
      : []

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

    const goTo = (path: string, label: string, icon: React.ReactNode): Command => ({
      id: `go-${path}`,
      label,
      hint: t('palette.goTo'),
      visual: actionIcon(icon),
      run: () => navigate(path)
    })
    const appCommands: Command[] = searching
      ? [
          goTo('/', t('sidebar.home'), <LuLightbulb size={15} />),
          goTo('/scenes', t('sidebar.scenes'), <LuPalette size={15} />),
          goTo('/information', t('sidebar.information'), <LuInfo size={15} />),
          {
            id: 'add-bulb',
            label: t('palette.addBulb'),
            hint: t('palette.action'),
            visual: actionIcon(<LuPlus size={15} />),
            run: () => navigate('/', { state: { intent: 'add' } })
          },
          {
            id: 'new-color',
            label: t('palette.newColor'),
            hint: t('palette.action'),
            visual: actionIcon(<LuPlus size={15} />),
            run: () => navigate('/scenes', { state: { intent: 'newColor' } })
          },
          ...(bulbs.length > 1
            ? [
                ...(favorites.length > 1
                  ? [
                      {
                        id: 'sort-favorites',
                        label: t('palette.sortFavorites'),
                        hint: t('palette.action'),
                        visual: actionIcon(<LuArrowDownUp size={15} />),
                        run: () => navigate('/scenes', { state: { intent: 'sortFavorites' } })
                      }
                    ]
                  : []),
                {
                  id: 'sort-bulbs',
                  label: t('palette.sortBulbs'),
                  hint: t('palette.action'),
                  visual: actionIcon(<LuArrowDownUp size={15} />),
                  run: () => navigate('/', { state: { intent: 'sort' } })
                }
              ]
            : []),
          ...(
            [
              ['light', t('palette.themeLight'), <LuSunMedium key="i" size={15} />],
              ['dark', t('palette.themeDark'), <LuMoon key="i" size={15} />],
              ['system', t('palette.themeSystem'), <LuMonitor key="i" size={15} />]
            ] as const
          ).map(([value, label, icon]) => ({
            id: `theme-${value}`,
            label,
            hint: settings.theme === value ? t('palette.current') : t('settings.theme.title'),
            keywords: t('settings.theme.title'),
            visual: actionIcon(icon),
            run: () => void setTheme(value)
          })),
          ...(
            [
              ['es', 'Español'],
              ['en', 'English'],
              ['auto', t('palette.languageSystem')]
            ] as const
          ).map(([value, label]) => ({
            id: `language-${value}`,
            label,
            hint: settings.language === value ? t('palette.current') : t('settings.language.title'),
            keywords: `${t('settings.language.title')} language idioma ${
              value === 'es' ? 'spanish espanol' : value === 'en' ? 'english ingles' : ''
            }`,
            visual: actionIcon(<LuLanguages size={15} />),
            run: () => void setLanguage(value)
          })),
          {
            id: 'reconnect',
            label: t('settings.search.title'),
            hint: t('palette.action'),
            keywords: `${t('settings.search.button')} reconnect reconectar search buscar conectar`,
            visual: actionIcon(<LuRefreshCw size={15} />),
            run: () => void reconnect()
          },
          {
            id: 'refresh',
            label: t('palette.refresh'),
            hint: t('palette.action'),
            keywords: 'refresh update actualizar datos',
            visual: actionIcon(<LuRefreshCw size={15} />),
            run: () => void probeAll().then(() => pushToast('information.refreshed', 'success'))
          },
          {
            id: 'settings',
            label: t('sidebar.settings'),
            hint: t('palette.open'),
            visual: actionIcon(<LuSettings size={15} />),
            run: onOpenSettings
          },
          {
            id: 'help',
            label: t('sidebar.help'),
            hint: t('palette.open'),
            visual: actionIcon(<LuCircleHelp size={15} />),
            run: onOpenHelp
          }
        ]
      : []

    // With an empty field: favorites first, then the quick actions.
    const pool = [
      ...scenes,
      ...otherBulbScenes,
      ...bulbCommands,
      ...brightnessCommands,
      ...allCommands,
      ...appCommands
    ]
    if (!searching) return { list: pool, total: pool.length }
    // Matches in the name come before matches in the hint, and names that start with the query
    // before the rest, so typing a bulb's name finds that bulb, not every scene "for" it.
    const rank = (c: Command) => {
      if (!matches(c.label, query)) return 2
      return normalizeText(c.label).startsWith(normalizeText(query)) ? 0 : 1
    }
    const found = pool
      .filter((c) => {
        const text = normalizeText(`${c.label} ${c.keywords ?? c.hint} ${c.keywords ? c.hint : ''}`)
        // From the start of a word: "tema" finds "Tema oscuro", not "Idioma del sistema".
        const tokens = text.split(/[\s·,.:;«»“”"()-]+/)
        return words.every((w) => tokens.some((token) => token.startsWith(w)))
      })
      .map((c, i) => ({ c, i, r: rank(c) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map(({ c }) => c)
    return { list: found.slice(0, MAX_RESULTS), total: found.length }
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
    setBrightness,
    setPower,
    reconnect,
    probeBulb,
    probeAll,
    setAllBulbs,
    setTheme,
    setLanguage,
    pushToast,
    settings,
    navigate,
    onOpenSettings,
    onOpenHelp
  ])
  const commands = results.list

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
      <div className="flex h-11 items-center gap-2.5 rounded-[12px] border-2 border-primary bg-surface px-3.5 text-muted">
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
          : results.total > commands.length
            ? t('palette.more', { shown: commands.length, count: results.total })
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

export default function CommandPalette({
  open,
  onOpenChange,
  onOpenSettings,
  onOpenHelp
}: CommandPaletteProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('palette.title')}
      className="top-24 max-w-[560px] translate-y-0"
    >
      <Palette
        onClose={() => onOpenChange(false)}
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
      />
    </Dialog>
  )
}
