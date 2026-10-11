import { MAX_DEFAULT_COLORS } from '@shared/constants'
import { BulbState } from '@shared/types/bulbState'
import { MultiBulbState } from '@shared/types/multiBulbState'
import { ToastMessage } from '@shared/types/toastMessage'
import log from 'electron-log/renderer'
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

  // State updates from main
  updateMultiBulbState: (state: MultiBulbState) => void
  addToast: (toast: ToastMessage) => void
  dismissToast: (id: string) => void

  // Active bulb operations
  toggleBulb: () => Promise<void>
  setBrightness: (brightness: number) => Promise<void>
  setBulbName: (name: string) => Promise<void>
  setScene: (sceneId: number) => Promise<void>
  addCustomColor: (colorName: string, colorHex: string) => Promise<void>
  setCustomColor: (colorId: number) => Promise<void>
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => Promise<void>
  removeCustomColor: (colorId: number) => Promise<void>
  toggleFavoriteColor: (colorId: number) => Promise<void>
  setFavoriteColorsOrder: (favoriteColors: number[]) => Promise<void>
  deleteProfile: () => Promise<void>

  // Multi-bulb actions
  setActiveBulb: (ip: string) => void
  toggleBulbByIp: (ip: string) => void
  addBulbByIp: (ip: string) => void
  deleteBulb: (ip: string) => void
  retryDiscovery: () => void
}

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
    log.debug('[RENDERER] Toggling active bulb')
    await window.api.toggleBulb()
  },
  setBrightness: async (brightness: number) => {
    log.debug('[RENDERER] Setting brightness')
    await window.api.setBrightness(brightness)
  },
  setBulbName: async (name: string) => {
    log.debug('[RENDERER] Setting bulb name')
    await window.api.setBulbName(name)
  },
  setScene: async (sceneId: number) => {
    if (sceneId >= MAX_DEFAULT_COLORS) {
      log.debug('[RENDERER] Trying to set a custom color')
      return useBulbStore.getState().setCustomColor(sceneId)
    }

    log.debug('[RENDERER] Setting scene')
    await window.api.setScene(sceneId)
  },
  addCustomColor: async (colorName: string, colorHex: string) => {
    const activeBulb = useBulbStore.getState().activeBulb
    if (!activeBulb) return

    const colorExists = activeBulb.customColors.some((color) => color.name === colorName)
    if (colorExists) {
      log.debug('[RENDERER] Custom color already exists')
      return
    }

    log.debug('[RENDERER] Adding custom color')
    await window.api.addCustomColor(colorName, colorHex)
  },
  setCustomColor: async (colorId: number) => {
    if (colorId < MAX_DEFAULT_COLORS) {
      log.debug('[RENDERER] Trying to set a default color')
      return useBulbStore.getState().setScene(colorId)
    }

    log.debug('[RENDERER] Setting custom color')
    await window.api.setCustomColor(colorId)
  },
  editCustomColor: async (colorId: number, colorName: string, colorHex: string) => {
    log.debug('[RENDERER] Editing custom color')
    await window.api.editCustomColor(colorId, colorName, colorHex)
  },
  removeCustomColor: async (colorId: number) => {
    log.debug('[RENDERER] Removing custom color')
    await window.api.removeCustomColor(colorId)
  },
  toggleFavoriteColor: async (colorId: number) => {
    log.debug('[RENDERER] Toggling favorite color')
    await window.api.toggleFavoriteColor(colorId)
  },
  setFavoriteColorsOrder: async (favoriteColors: number[]) => {
    log.debug('[RENDERER] Setting favorite colors order')
    await window.api.setFavoriteColorsOrder(favoriteColors)
  },
  deleteProfile: async () => {
    log.debug('[RENDERER] Deleting profile')
    await window.api.deleteProfile()
  },

  // Multi-bulb actions
  setActiveBulb: (ip: string) => {
    log.debug('[RENDERER] Setting active bulb:', ip)
    window.api.setActiveBulb(ip)
  },
  toggleBulbByIp: (ip: string) => {
    log.debug('[RENDERER] Toggling bulb by IP:', ip)
    window.api.toggleBulbByIp(ip)
  },
  addBulbByIp: (ip: string) => {
    log.debug('[RENDERER] Adding bulb by IP:', ip)
    window.api.addBulbByIp(ip)
  },
  deleteBulb: (ip: string) => {
    log.debug('[RENDERER] Deleting bulb:', ip)
    window.api.deleteBulb(ip)
  },
  retryDiscovery: () => {
    log.debug('[RENDERER] Retrying discovery')
    window.api.retryDiscovery()
  }
}))

// Set up listener for bulb updates
window.api.onUpdateBulb((state: MultiBulbState) => {
  useBulbStore.getState().updateMultiBulbState(state)
})

// Set up listener for toast messages
window.api.onShowToast((toast: ToastMessage) => {
  useBulbStore.getState().addToast(toast)
})

// Initial state
window.api.getBulbsWhenReady().then((state: MultiBulbState) => {
  useBulbStore.getState().updateMultiBulbState(state)
  useBulbStore.setState({ isReady: true })
})
