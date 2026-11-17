import type { AppError } from '@renderer/bindings/AppError'
import type { BulbState } from '@renderer/bindings/BulbState'
import type { LanguagePref } from '@renderer/bindings/LanguagePref'
import type { MultiBulbState } from '@renderer/bindings/MultiBulbState'
import type { Settings } from '@renderer/bindings/Settings'
import type { Theme } from '@renderer/bindings/Theme'
import type { ToastMessage } from '@renderer/bindings/ToastMessage'
import i18n from '@i18n/index'
import { MAX_DEFAULT_COLORS } from '@renderer/constants'
import { api } from '@renderer/lib/api'
import { applyTheme } from '@renderer/lib/theme'
import * as log from '@tauri-apps/plugin-log'
import { create } from 'zustand'

/**
 * A toast; `params` fill the `{{placeholders}}` of the translated message. `undo` (renderer-only)
 * adds an "Undo" button that runs it.
 */
export type AppToast = ToastMessage & {
  params?: Record<string, string | number>
  undo?: () => void
  /** Where the focus goes back after "Undo" (the control that started the action). */
  origin?: HTMLElement | null
}

/** What the UI expects a bulb to look like while a command is in flight. */
type Expected = Partial<Pick<BulbState, 'state' | 'dimming' | 'sceneId'>>

type Overlay = {
  values: Expected
  /** Commands sent and not answered yet. */
  pending: number
  /** All of them answered; dropped by the next backend update (or a short timer). */
  settled: boolean
}

export type AddBulbResult =
  | { ok: true; outcome: 'added' | 'duplicate' }
  | { ok: false; code: AppError['code'] }

interface BulbStore {
  // Merged view: backend state plus optimistic overlays.
  bulbs: BulbState[]
  activeBulb: BulbState | null
  isDiscovering: boolean
  discoveryFailed: boolean
  isReady: boolean

  settings: Settings
  toasts: AppToast[]

  // Backend -> store
  updateMultiBulbState: (state: MultiBulbState) => void
  addToast: (toast: AppToast) => void
  pushToast: (
    message: string,
    type: ToastMessage['type'],
    params?: AppToast['params'],
    autoDismiss?: boolean
  ) => void
  dismissToast: (id: string) => void

  // One bulb; `ip` omitted means the active bulb.
  toggleBulb: (ip?: string) => Promise<void>
  /** Absolute on/off (undo uses it: a toggle could flip a bulb that changed meanwhile). */
  setPower: (on: boolean, ip?: string) => Promise<void>
  setBrightness: (brightness: number, ip?: string) => Promise<void>
  setScene: (sceneId: number, ip?: string) => Promise<void>
  setBulbName: (name: string, ip?: string) => Promise<void>
  /** Resolves `true` once saved. */
  addCustomColor: (colorName: string, colorHex: string) => Promise<boolean>
  /** Resolves `true` once saved. */
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => Promise<boolean>
  removeCustomColor: (colorId: number) => Promise<void>
  toggleFavoriteColor: (colorId: number) => Promise<void>
  setFavoriteColorsOrder: (favoriteColors: number[]) => Promise<void>
  setBulbsOrder: (ips: string[]) => Promise<void>
  deleteProfile: () => Promise<void>

  // Every bulb
  setAllBulbs: (on: boolean) => Promise<void>
  applyToAll: (id: number) => Promise<void>

  // Bulb list
  setActiveBulb: (ip: string) => Promise<void>
  addBulbByIp: (ip: string) => Promise<AddBulbResult>
  deleteBulb: (ip: string) => Promise<void>
  probeBulb: (ip: string) => Promise<void>
  /** Polls every bulb (the Information page's refresh). */
  probeAll: () => Promise<void>
  retryDiscovery: () => Promise<void>
  /** Searches the saved bulbs again and says, in one toast, how many answer. */
  reconnect: () => Promise<void>

  // Settings
  loadSettings: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  setLanguage: (language: LanguagePref) => Promise<void>

  // App
  installUpdate: () => Promise<void>
  openAppsSettings: () => Promise<void>
}

const ERROR_CODES: AppError['code'][] = [
  'bulbOffline',
  'bulbRejected',
  'unknownBulb',
  'bulbUnreachable',
  'invalidArgument',
  'io',
  'updater'
]

const SETTLE_MS = 400

const debug = (message: string) => {
  // Outside Tauri (plain browser dev) the log plugin is missing; never let that surface.
  void log.debug(`[RENDERER] ${message}`).catch(() => undefined)
}

export const errorCode = (error: unknown): AppError['code'] => {
  const code = (error as { code?: AppError['code'] } | null)?.code
  return code && ERROR_CODES.includes(code) ? code : 'io'
}

// Raw backend state and overlays live outside the store so `merge` always sees both.
let rawBulbs: BulbState[] = []
let rawActiveIp: string | null = null
const overlays: Record<string, Overlay> = {}

const merge = (): Pick<BulbStore, 'bulbs' | 'activeBulb'> => {
  const bulbs = rawBulbs.map((b) => {
    const o = overlays[b.ip]
    return o ? { ...b, ...o.values } : b
  })
  return { bulbs, activeBulb: bulbs.find((b) => b.ip === rawActiveIp) ?? null }
}

const effective = (ip: string): BulbState | undefined =>
  useBulbStore.getState().bulbs.find((b) => b.ip === ip)

const remerge = () => useBulbStore.setState(merge())

/** Starts an optimistic change; returns the function that settles it. */
const expect = (ips: string[], values: Expected) => {
  for (const ip of ips) {
    const o = overlays[ip] ?? { values: {}, pending: 0, settled: false }
    overlays[ip] = { values: { ...o.values, ...values }, pending: o.pending + 1, settled: false }
  }
  remerge()

  return (failedIps: string[] = []) => {
    for (const ip of ips) {
      const o = overlays[ip]
      if (!o) continue
      const pending = o.pending - 1
      if (failedIps.includes(ip)) {
        // Back to the real value: drop what this command had set.
        const values = { ...o.values }
        for (const key of Object.keys(values) as (keyof Expected)[]) delete values[key]
        if (pending <= 0) delete overlays[ip]
        else overlays[ip] = { values, pending, settled: false }
      } else if (pending <= 0) {
        overlays[ip] = { ...o, pending: 0, settled: true }
        // The backend update normally clears it first; this is the safety net.
        setTimeout(() => {
          if (overlays[ip]?.settled) {
            delete overlays[ip]
            remerge()
          }
        }, SETTLE_MS)
      } else {
        overlays[ip] = { ...o, pending }
      }
    }
    remerge()
  }
}

const activeIp = () => rawActiveIp

const toast = (
  message: string,
  type: ToastMessage['type'],
  params?: AppToast['params'],
  autoDismiss = true
): AppToast => ({ id: crypto.randomUUID(), message, type, autoDismiss, params })

/**
 * Runs a backend call. An offline bulb is already shown in its row (the backend marks it
 * `online: false`), so only the other errors become a toast.
 */
const call = async <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
  debug(label)
  try {
    return await fn()
  } catch (error) {
    debug(`${label} failed: ${JSON.stringify(error)}`)
    const code = errorCode(error)
    if (code !== 'bulbOffline') {
      useBulbStore.getState().addToast(toast(`toast.error.${code}`, 'error'))
    }
    return undefined
  }
}

/** Runs an optimistic single-bulb command. */
const optimistic = async (
  label: string,
  ip: string | null | undefined,
  values: Expected,
  fn: () => Promise<void>
): Promise<void> => {
  const target = ip ?? activeIp()
  const settle = target ? expect([target], values) : () => undefined
  const result = await call(label, async () => {
    await fn()
    return true
  })
  settle(result ? [] : target ? [target] : [])
}

/**
 * Runs an optimistic all-bulbs command, reports who did not answer and returns their IPs
 * (every online bulb when the call itself failed).
 */
const optimisticAll = async (
  label: string,
  values: Expected,
  fn: () => Promise<string[]>
): Promise<string[]> => {
  const online = useBulbStore
    .getState()
    .bulbs.filter((b) => b.online)
    .map((b) => b.ip)
  const settle = expect(online, values)
  const failed = await call(label, fn)
  settle(failed ?? online)

  const missed = failed ?? []
  if (missed.length > 0) {
    const names = missed.map((ip) => effective(ip)?.name ?? ip).join(', ')
    useBulbStore.getState().addToast(toast('toast.someDidNotRespond', 'error', { names }))
  }
  return failed ?? online
}

export const useBulbStore = create<BulbStore>((set, get) => ({
  bulbs: [],
  activeBulb: null,
  isDiscovering: true,
  discoveryFailed: false,
  isReady: false,

  settings: { theme: 'system', language: 'auto' },
  toasts: [],

  updateMultiBulbState: (state: MultiBulbState) => {
    rawBulbs = state.bulbs
    rawActiveIp = state.activeBulb?.ip ?? null
    // An update that arrives after the command was answered carries its result.
    for (const [ip, o] of Object.entries(overlays)) {
      if (o.settled) delete overlays[ip]
    }
    // Overlays of bulbs that no longer exist are meaningless.
    for (const ip of Object.keys(overlays)) {
      if (!rawBulbs.some((b) => b.ip === ip)) delete overlays[ip]
    }
    set({
      ...merge(),
      isDiscovering: state.isDiscovering,
      discoveryFailed: state.discoveryFailed
    })
  },

  // The same message twice in a row replaces the first instead of stacking a copy.
  addToast: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts.filter(
          (old) =>
            !(old.message === t.message && JSON.stringify(old.params) === JSON.stringify(t.params))
        ),
        t
      ]
    })),
  pushToast: (message, type, params, autoDismiss = true) =>
    get().addToast(toast(message, type, params, autoDismiss)),
  dismissToast: (id) => {
    // The backend keeps pinned toasts to show them again in a window reopened from the tray.
    if (get().toasts.some((t) => t.id === id && !t.autoDismiss)) {
      void api.dismissToast(id).catch(() => undefined)
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  toggleBulb: async (ip) => {
    const target = ip ?? activeIp()
    if (!target) return
    const current = effective(target)
    await optimistic('Toggling bulb', target, { state: !current?.state }, () =>
      ip ? api.toggleBulbByIp(ip) : api.toggleBulb()
    )
  },
  setPower: async (on, ip) => {
    await optimistic('Setting power', ip, { state: on }, () => api.setPower(on, ip))
  },
  setBrightness: async (brightness, ip) => {
    await optimistic('Setting brightness', ip, { dimming: brightness }, () =>
      api.setBrightness(brightness, ip)
    )
  },
  setScene: async (sceneId, ip) => {
    // Scenes and custom colors share one id space (see MAX_DEFAULT_COLORS).
    const run =
      sceneId >= MAX_DEFAULT_COLORS
        ? () => api.setCustomColor(sceneId, ip)
        : () => api.setScene(sceneId, ip)
    await optimistic('Setting scene', ip, { state: true, sceneId }, run)
  },
  setBulbName: async (name, ip) => {
    await call('Setting bulb name', () => api.setBulbName(name, ip))
  },
  addCustomColor: async (colorName, colorHex) => {
    const saved = await call('Adding custom color', async () => {
      await api.addCustomColor(colorName, colorHex)
      return true
    })
    return saved === true
  },
  editCustomColor: async (colorId, colorName, colorHex) => {
    const saved = await call('Editing custom color', async () => {
      await api.editCustomColor(colorId, colorName, colorHex)
      return true
    })
    return saved === true
  },
  removeCustomColor: async (colorId) => {
    await call('Removing custom color', () => api.removeCustomColor(colorId))
  },
  toggleFavoriteColor: async (colorId) => {
    await call('Toggling favorite color', () => api.toggleFavoriteColor(colorId))
  },
  setFavoriteColorsOrder: async (favoriteColors) => {
    await call('Setting favorite colors order', () => api.setFavoriteColorsOrder(favoriteColors))
  },
  setBulbsOrder: async (ips) => {
    await call('Setting bulbs order', () => api.setBulbsOrder(ips))
  },
  deleteProfile: async () => {
    await call('Deleting profile', () => api.deleteProfile())
  },

  setAllBulbs: async (on) => {
    // The bulbs this changes, so "Undo" switches back exactly those.
    const changed = get()
      .bulbs.filter((b) => b.online && b.state !== on)
      .map((b) => b.ip)
    const missed = await optimisticAll('Setting all bulbs', { state: on }, () =>
      api.setAllBulbs(on)
    )
    // Only the bulbs that really changed count, and only those go back.
    const done = changed.filter((ip) => !missed.includes(ip))
    if (done.length === 0) return
    get().addToast({
      ...toast(on ? 'toast.allOnDone' : 'toast.allOffDone', 'success', { count: done.length }),
      undo: () => done.forEach((ip) => void get().setPower(!on, ip)),
      origin: document.activeElement as HTMLElement | null
    })
  },
  applyToAll: async (id) => {
    const before = get()
      .bulbs.filter((b) => b.online)
      .map((b) => ({ ip: b.ip, state: b.state, sceneId: b.sceneId }))
    const missed = await optimisticAll('Applying to all bulbs', { state: true, sceneId: id }, () =>
      api.applyToAll(id)
    )
    // Like all on/off: only the bulbs that changed count (and go back on undo).
    const done = before.filter((b) => !missed.includes(b.ip) && (!b.state || b.sceneId !== id))
    if (done.length === 0) return
    // A bulb that was on in plain white or a color picked elsewhere (scene 0) has nothing this
    // app can set back, so undo leaves it as it is and says so.
    const lost = done.filter((b) => b.state && b.sceneId === 0)
    const undoable = done.filter((b) => !lost.includes(b))
    get().addToast({
      ...toast('toast.appliedToAll', 'success'),
      origin: document.activeElement as HTMLElement | null,
      undo:
        undoable.length === 0
          ? undefined
          : () => {
              undoable.forEach(async (b) => {
                if (b.sceneId > 0 && b.sceneId !== id) await get().setScene(b.sceneId, b.ip)
                if (!b.state) await get().setPower(false, b.ip)
              })
              if (lost.length > 0) {
                const names = lost.map((b) => effective(b.ip)?.name ?? b.ip).join(', ')
                get().addToast(toast('toast.undoPartial', 'info', { names }))
              }
            }
    })
  },

  setActiveBulb: async (ip) => {
    await call(`Setting active bulb: ${ip}`, () => api.setActiveBulb(ip))
  },
  addBulbByIp: async (ip) => {
    debug(`Adding bulb by IP: ${ip}`)
    try {
      return { ok: true, outcome: (await api.addBulbByIp(ip)) === 'added' ? 'added' : 'duplicate' }
    } catch (error) {
      debug(`Adding bulb failed: ${JSON.stringify(error)}`)
      return { ok: false, code: errorCode(error) }
    }
  },
  deleteBulb: async (ip) => {
    await call(`Deleting bulb: ${ip}`, () => api.deleteBulb(ip))
  },
  probeBulb: async (ip) => {
    await call(`Probing bulb: ${ip}`, () => api.probeBulb(ip))
  },
  probeAll: async () => {
    await Promise.all(get().bulbs.map((b) => get().probeBulb(b.ip)))
  },
  retryDiscovery: async () => {
    await call('Retrying discovery', () => api.retryDiscovery())
  },
  reconnect: async () => {
    const searching = toast('home.searching', 'info', undefined, false)
    get().addToast(searching)
    // Wait for the search to start and end (the backend reports both through updates).
    const finished = new Promise<void>((resolve) => {
      let started = get().isDiscovering
      const stop = useBulbStore.subscribe((s) => {
        if (s.isDiscovering) started = true
        else if (started) {
          stop()
          resolve()
        }
      })
      window.setTimeout(() => {
        stop()
        resolve()
      }, 30_000)
    })
    await get().retryDiscovery()
    await finished
    get().dismissToast(searching.id)
    const { bulbs, discoveryFailed } = get()
    // "No bulb found" already comes from the backend as its own toast.
    if (discoveryFailed) return
    const online = bulbs.filter((b) => b.online).length
    get().addToast(
      toast('toast.reconnected', online === bulbs.length ? 'success' : 'info', {
        online,
        total: bulbs.length
      })
    )
  },

  loadSettings: async () => {
    const settings = await call('Loading settings', () => api.getSettings())
    if (!settings) return
    set({ settings })
    applyTheme(settings.theme)
  },
  setTheme: async (theme) => {
    const previous = get().settings
    const next = { ...previous, theme }
    set({ settings: next })
    applyTheme(theme)
    if ((await call('Saving theme', () => api.setSettings(next))) === undefined) {
      set({ settings: previous })
      applyTheme(previous.theme)
    }
  },
  setLanguage: async (language) => {
    const previous = get().settings
    const next = { ...previous, language }
    set({ settings: next })
    if ((await call('Saving language', () => api.setSettings(next))) === undefined) {
      set({ settings: previous })
      return
    }
    // The backend resolves "auto" to the system language.
    await i18n.changeLanguage(await api.getLanguage())
  },

  installUpdate: async () => {
    await call('Installing update', () => api.installUpdate())
  },
  openAppsSettings: async () => {
    await call('Opening installed apps settings', () => api.openAppsSettings())
  }
}))

// Backend -> renderer events.
api.onUpdateBulb((state) => useBulbStore.getState().updateMultiBulbState(state))
api.onShowToast((t) => useBulbStore.getState().addToast(t))

// Initial state. The window is shown only once this resolved (see Layout.tsx).
api
  .getBulbs()
  .then((state) => useBulbStore.getState().updateMultiBulbState(state))
  .catch((error) => debug(`Initial state failed: ${JSON.stringify(error)}`))
  .finally(() => useBulbStore.setState({ isReady: true }))
void useBulbStore.getState().loadSettings()
