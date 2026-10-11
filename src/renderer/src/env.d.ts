/// <reference types="vite/client" />
import type { MultiBulbState } from '@shared/types/multiBulbState'
import type { ToastMessage } from '@shared/types/toastMessage'

// Temporary: replaced by src/renderer/src/lib/api.ts in M4.
interface IElectronAPI {
  onUpdateBulb: (callback: (state: MultiBulbState) => void) => void
  onShowToast: (callback: (toast: ToastMessage) => void) => void
  getBulbsWhenReady: () => Promise<MultiBulbState>
  toggleBulb: () => void
  setBrightness: (brightness: number) => void
  setBulbName: (name: string, ip?: string) => void
  setScene: (sceneId: number) => void
  addCustomColor: (colorName: string, colorHex: string) => void
  setCustomColor: (colorId: number) => void
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => void
  removeCustomColor: (colorId: number) => void
  toggleFavoriteColor: (colorId: number) => void
  setFavoriteColorsOrder: (favoriteColors: number[]) => void
  setActiveBulb: (ip: string) => void
  toggleBulbByIp: (ip: string) => void
  addBulbByIp: (ip: string) => void
  deleteBulb: (ip: string) => void
  retryDiscovery: () => void
  deleteProfile: () => void
  openAppFolder: () => void
  getLanguage: () => Promise<string>
  checkForUpdates: () => Promise<boolean>
  getVersion: () => Promise<string>
  showWindow: () => void
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
