import { BulbState } from '@/types/bulbState'
import log from 'electron-log/renderer'
import { create } from 'zustand'

interface BulbStore {
  bulb: BulbState
  updateBulbState: (bulb: BulbState) => void
  toggleBulb: () => Promise<void>
  setBrightness: (brightness: number) => Promise<void>
  setBulbName: (name: string) => Promise<void>
  setIp: (ip: string) => Promise<void>
  setScene: (sceneId: number) => Promise<void>
  addCustomColor: (colorName: string, colorHex: string) => Promise<void>
  setCustomColor: (colorId: number) => Promise<void>
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => Promise<void>
  removeCustomColor: (colorId: number) => Promise<void>
  toggleFavoriteColor: (colorId: number) => Promise<void>
}

export const useBulbStore = create<BulbStore>((set) => ({
  bulb: {} as BulbState,
  updateBulbState: (bulb: BulbState) => {
    set({ bulb })
  },
  toggleBulb: async () => {
    log.debug('[RENDERER] Toggling bulb state')
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
  setIp: async (ip: string) => {
    log.debug('[RENDERER] Setting bulb IP')
    await window.api.setIp(ip)
  },
  setScene: async (sceneId: number) => {
    log.debug('[RENDERER] Setting scene')
    await window.api.setScene(sceneId)
  },
  addCustomColor: async (colorName: string, colorHex: string) => {
    log.debug('[RENDERER] Adding custom color')
    await window.api.addCustomColor(colorName, colorHex)
  },
  setCustomColor: async (colorId: number) => {
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
  }
}))

// Set up listener for bulb updates
window.api.onUpdateBulb((bulb: BulbState) => {
  useBulbStore.getState().updateBulbState(bulb)
})

// Initial state
window.api.getBulbWhenReady().then((bulb: BulbState) => {
  useBulbStore.getState().updateBulbState(bulb)
})
