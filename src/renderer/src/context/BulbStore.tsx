import type { AppError } from '@renderer/bindings/AppError'
import type { BulbState } from '@renderer/bindings/BulbState'
import type { MultiBulbState } from '@renderer/bindings/MultiBulbState'
import type { ToastMessage } from '@renderer/bindings/ToastMessage'
import { MAX_DEFAULT_COLORS } from '@renderer/constants'
import { api } from '@renderer/lib/api'
import * as log from '@tauri-apps/plugin-log'
import { create } from 'zustand'

interface BulbStore {
  // Multi-bulb state
  bulbs: BulbState[]
  activeBulb: BulbState | null
  isDiscovering: boolean
  discoveryFailed: boolean
  isReady: boolean

  // Toast state
  toasts: ToastMessage[]

  // State updates from the backend
  updateMultiBulbState: (state: MultiBulbState) => void
  addToast: (toast: ToastMessage) => void
  dismissToast: (id: string) => void

  // Active bulb operations
  toggleBulb: () => Promise<void>
  setBrightness: (brightness: number) => Promise<void>
  setBulbName: (name: string, ip?: string) => Promise<void>
  setScene: (sceneId: number) => Promise<void>
  addCustomColor: (colorName: string, colorHex: string) => Promise<void>
  setCustomColor: (colorId: number) => Promise<void>
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => Promise<void>
  removeCustomColor: (colorId: number) => Promise<void>
  toggleFavoriteColor: (colorId: number) => Promise<void>
  setFavoriteColorsOrder: (favoriteColors: number[]) => Promise<void>
  deleteProfile: () => Promise<void>

  // Multi-bulb actions
  setActiveBulb: (ip: string) => Promise<void>
  toggleBulbByIp: (ip: string) => Promise<void>
  addBulbByIp: (ip: string) => Promise<void>
  deleteBulb: (ip: string) => Promise<void>
  probeBulb: (ip: string) => Promise<void>
  retryDiscovery: () => Promise<void>

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

const debug = (message: string) => {
  // Outside Tauri (plain browser dev) the log plugin is missing; never let that surface.
  void log.debug(`[RENDERER] ${message}`).catch(() => undefined)
}

const errorToast = (error: unknown): ToastMessage => {
  const code = (error as { code?: AppError['code'] } | null)?.code
  const known = code && ERROR_CODES.includes(code) ? code : 'io'
  return {
    id: crypto.randomUUID(),
    message: `toast.error.${known}`,
    type: 'error',
    autoDismiss: true
  }
}

/**
 * Runs a backend call. Commands reject with an `AppError`; it becomes an error toast
 * so no failure is silent. State changes arrive separately through `on-update-bulb`.
 */
const call = async <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
  debug(label)
  try {
    return await fn()
  } catch (error) {
    debug(`${label} failed: ${JSON.stringify(error)}`)
    useBulbStore.getState().addToast(errorToast(error))
    return undefined
  }
}

const infoToast = (message: string, type: ToastMessage['type']): ToastMessage => ({
  id: crypto.randomUUID(),
  message,
  type,
  autoDismiss: true
})

export const useBulbStore = create<BulbStore>((set) => ({
  bulbs: [],
  activeBulb: null,
  isDiscovering: true,
  discoveryFailed: false,
  isReady: false,

  toasts: [],

  updateMultiBulbState: (state: MultiBulbState) =>
    set({
      bulbs: state.bulbs,
      activeBulb: state.activeBulb,
      isDiscovering: state.isDiscovering,
      discoveryFailed: state.discoveryFailed
    }),

  addToast: (toast: ToastMessage) => set((state) => ({ toasts: [...state.toasts, toast] })),

  dismissToast: (id: string) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // Active bulb operations
  toggleBulb: async () => {
    await call('Toggling active bulb', () => api.toggleBulb())
  },
  setBrightness: async (brightness: number) => {
    await call('Setting brightness', () => api.setBrightness(brightness))
  },
  setBulbName: async (name: string, ip?: string) => {
    await call('Setting bulb name', () => api.setBulbName(name, ip))
  },
  setScene: async (sceneId: number): Promise<void> => {
    if (sceneId >= MAX_DEFAULT_COLORS) {
      return useBulbStore.getState().setCustomColor(sceneId)
    }
    await call('Setting scene', () => api.setScene(sceneId))
  },
  addCustomColor: async (colorName: string, colorHex: string) => {
    const activeBulb = useBulbStore.getState().activeBulb
    if (!activeBulb) return

    const colorExists = activeBulb.customColors.some((color) => color.name === colorName)
    if (colorExists) {
      debug('Custom color already exists')
      return
    }

    await call('Adding custom color', () => api.addCustomColor(colorName, colorHex))
  },
  setCustomColor: async (colorId: number): Promise<void> => {
    if (colorId < MAX_DEFAULT_COLORS) {
      return useBulbStore.getState().setScene(colorId)
    }
    await call('Setting custom color', () => api.setCustomColor(colorId))
  },
  editCustomColor: async (colorId: number, colorName: string, colorHex: string) => {
    await call('Editing custom color', () => api.editCustomColor(colorId, colorName, colorHex))
  },
  removeCustomColor: async (colorId: number) => {
    await call('Removing custom color', () => api.removeCustomColor(colorId))
  },
  toggleFavoriteColor: async (colorId: number) => {
    await call('Toggling favorite color', () => api.toggleFavoriteColor(colorId))
  },
  setFavoriteColorsOrder: async (favoriteColors: number[]) => {
    await call('Setting favorite colors order', () => api.setFavoriteColorsOrder(favoriteColors))
  },
  deleteProfile: async () => {
    await call('Deleting profile', () => api.deleteProfile())
  },

  // Multi-bulb actions
  setActiveBulb: async (ip: string) => {
    await call(`Setting active bulb: ${ip}`, () => api.setActiveBulb(ip))
  },
  toggleBulbByIp: async (ip: string) => {
    await call(`Toggling bulb by IP: ${ip}`, () => api.toggleBulbByIp(ip))
  },
  addBulbByIp: async (ip: string) => {
    debug(`Adding bulb by IP: ${ip}`)
    const addToast = useBulbStore.getState().addToast
    try {
      const outcome = await api.addBulbByIp(ip)
      addToast(
        outcome === 'added'
          ? infoToast('toast.addSuccess', 'success')
          : infoToast('toast.addDuplicate', 'info')
      )
    } catch (error) {
      debug(`Adding bulb failed: ${JSON.stringify(error)}`)
      const code = (error as { code?: string } | null)?.code
      // Not reachable is the expected failure; anything else gets its own message.
      addToast(
        code === 'bulbUnreachable' || code === 'invalidArgument'
          ? infoToast('toast.addFailed', 'error')
          : errorToast(error)
      )
    }
  },
  deleteBulb: async (ip: string) => {
    await call(`Deleting bulb: ${ip}`, () => api.deleteBulb(ip))
  },
  probeBulb: async (ip: string) => {
    await call(`Probing bulb: ${ip}`, () => api.probeBulb(ip))
  },
  retryDiscovery: async () => {
    await call('Retrying discovery', () => api.retryDiscovery())
  },

  // App
  installUpdate: async () => {
    await call('Installing update', () => api.installUpdate())
  },
  openAppsSettings: async () => {
    await call('Opening installed apps settings', () => api.openAppsSettings())
  }
}))

// Backend -> renderer events.
api.onUpdateBulb((state) => useBulbStore.getState().updateMultiBulbState(state))
api.onShowToast((toast) => useBulbStore.getState().addToast(toast))

// Initial state. The window is shown only once this resolved (see Home.tsx).
api
  .getBulbs()
  .then((state) => useBulbStore.getState().updateMultiBulbState(state))
  .catch((error) => debug(`Initial state failed: ${JSON.stringify(error)}`))
  .finally(() => useBulbStore.setState({ isReady: true }))
