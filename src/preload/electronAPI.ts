import { MultiBulbState } from '@shared/types/multiBulbState'
import { ToastMessage } from '@shared/types/toastMessage'

export interface IElectronAPI {
  // Listeners
  onUpdateBulb: (callback: (state: MultiBulbState) => void) => void
  onShowToast: (callback: (toast: ToastMessage) => void) => void
  getBulbsWhenReady: () => Promise<MultiBulbState>

  // Active bulb operations
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

  // Multi-bulb operations
  setActiveBulb: (ip: string) => void
  toggleBulbByIp: (ip: string) => void
  addBulbByIp: (ip: string) => void
  deleteBulb: (ip: string) => void
  retryDiscovery: () => void
  deleteProfile: () => void

  // Utility
  openAppFolder: () => void
  getLanguage: () => Promise<string>
  checkForUpdates: () => Promise<boolean>
  getVersion: () => Promise<string>
  showWindow: () => void
}
