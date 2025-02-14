import { BulbState } from '@/types/bulbState'
import log from 'electron-log/renderer'
import { create } from 'zustand'

interface BulbStore {
  bulb: BulbState
  toggleBulb: () => Promise<void>
  setBrightness: (brightness: number) => Promise<void>
  setBulbName: (name: string) => Promise<void>
  setIp: (ip: string) => Promise<void>
  setScene: (sceneId: number) => Promise<void>
  addCustomColor: (colorName: string, colorHex: string) => Promise<void>
  setCustomColor: (colorName: string) => Promise<void>
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => Promise<void>
  removeCustomColor: (colorId: number) => Promise<void>
  initializeBulb: () => Promise<void>
}

export const useBulbStore = create<BulbStore>((set) => ({
  bulb: {} as BulbState,
  toggleBulb: async () => {
    log.debug('[RENDERER] Toggling bulb state')
    await window.api.toggleBulb()
    set((state) => ({ bulb: { ...state.bulb, state: !state.bulb.state } }))
  },
  setBrightness: async (brightness: number) => {
    log.debug('[RENDERER] Setting brightness')
    await window.api.setBrightness(brightness)
    set((state) => ({ bulb: { ...state.bulb, brightness } }))
  },
  setBulbName: async (name: string) => {
    log.debug('[RENDERER] Setting bulb name')
    await window.api.setBulbName(name)
    set((state) => ({ bulb: { ...state.bulb, name } }))
  },
  setIp: async (ip: string) => {
    log.debug('[RENDERER] Setting bulb IP')
    await window.api.setIp(ip)
    set((state) => ({ bulb: { ...state.bulb, ip } }))
  },
  setScene: async (sceneId: number) => {
    log.debug('[RENDERER] Setting scene')
    await window.api.setScene(sceneId)
    set((state) => ({ bulb: { ...state.bulb, scene: sceneId } }))
  },
  addCustomColor: async (colorName: string, colorHex: string) => {
    log.debug('[RENDERER] Adding custom color')
    await window.api.addCustomColor(colorName, colorHex)
    set((state) => ({
      bulb: {
        ...state.bulb,
        customColors: [
          ...state.bulb.customColors,
          { id: state.bulb.customColors.length + 33, name: colorName, hex: colorHex } //TODO: Constant
        ]
      }
    }))
  },
  setCustomColor: async (colorName: string) => {
    log.debug('[RENDERER] Setting custom color')
    await window.api.setCustomColor(colorName)
    set((state) => ({ bulb: { ...state.bulb, currentColor: colorName } }))
  },
  editCustomColor: async (colorId: number, colorName: string, colorHex: string) => {
    log.debug('[RENDERER] Editing custom color')
    await window.api.editCustomColor(colorId, colorName, colorHex)
    set((state) => ({
      bulb: {
        ...state.bulb,
        customColors: state.bulb.customColors.map((color) =>
          color.id === colorId ? { id: colorId, name: colorName, hex: colorHex } : color
        )
      }
    }))
  },
  removeCustomColor: async (colorId: number) => {
    log.debug('[RENDERER] Removing custom color')
    await window.api.removeCustomColor(colorId)
    set((state) => ({
      bulb: {
        ...state.bulb,
        customColors: state.bulb.customColors.filter((_, index) => index !== colorId)
      }
    }))
  },

  initializeBulb: async () => {
    // Initialize bulb data
    log.debug('[RENDERER] Loading bulb data')
    const bulbData = await window.api.getBulbWhenReady()
    set({ bulb: bulbData })
    log.debug('[RENDERER] Bulb loaded')

    // Set up listener for bulb updates
    window.api.onUpdateBulb((updatedBulb: BulbState) => {
      log.debug('[RENDERER] Bulb updated')
      set({ bulb: updatedBulb })
    })
  }
}))
