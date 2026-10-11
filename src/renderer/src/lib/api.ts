import type { AddBulbOutcome } from '@renderer/bindings/AddBulbOutcome'
import type { MultiBulbState } from '@renderer/bindings/MultiBulbState'
import type { ToastMessage } from '@renderer/bindings/ToastMessage'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

type Unsubscribe = () => void

const subscribe = <T>(event: string, callback: (payload: T) => void): Unsubscribe => {
  const unlisten = listen<T>(event, (e) => callback(e.payload))
  return () => {
    void unlisten.then((off) => off())
  }
}

/**
 * Thin typed wrapper over the Tauri commands. Commands reject with an `AppError`
 * (`{ code, ... }`); callers decide how to surface it.
 */
export const api = {
  // Events from Rust
  onUpdateBulb: (callback: (state: MultiBulbState) => void): Unsubscribe =>
    subscribe('on-update-bulb', callback),
  onShowToast: (callback: (toast: ToastMessage) => void): Unsubscribe =>
    subscribe('on-show-toast', callback),

  getBulbs: () => invoke<MultiBulbState>('get_bulbs'),

  // Active bulb
  toggleBulb: () => invoke<void>('toggle_bulb'),
  setBrightness: (brightness: number) => invoke<void>('set_brightness', { brightness }),
  setBulbName: (name: string, ip?: string) => invoke<void>('set_bulb_name', { name, ip }),
  setScene: (sceneId: number) => invoke<void>('set_scene', { sceneId }),
  setCustomColor: (colorId: number) => invoke<void>('set_custom_color', { colorId }),

  // Colors and favorites (global)
  addCustomColor: (colorName: string, colorHex: string) =>
    invoke<void>('add_custom_color', { colorName, colorHex }),
  editCustomColor: (colorId: number, colorName: string, colorHex: string) =>
    invoke<void>('edit_custom_color', { colorId, colorName, colorHex }),
  removeCustomColor: (colorId: number) => invoke<void>('remove_custom_color', { colorId }),
  toggleFavoriteColor: (colorId: number) => invoke<void>('toggle_favorite_color', { colorId }),
  setFavoriteColorsOrder: (favoriteColors: number[]) =>
    invoke<void>('set_favorite_colors_order', { favoriteColors }),

  // Multi-bulb
  setActiveBulb: (ip: string) => invoke<void>('set_active_bulb', { ip }),
  toggleBulbByIp: (ip: string) => invoke<void>('toggle_bulb_by_ip', { ip }),
  addBulbByIp: (ip: string) => invoke<AddBulbOutcome>('add_bulb_by_ip', { ip }),
  deleteBulb: (ip: string) => invoke<void>('delete_bulb', { ip }),
  probeBulb: (ip: string) => invoke<void>('probe_bulb', { ip }),
  retryDiscovery: () => invoke<void>('retry_discovery'),
  deleteProfile: () => invoke<void>('delete_profile'),

  // App
  /** Never rejects: the UI must mount even if the backend is unavailable. */
  getLanguage: (): Promise<string> =>
    invoke<string>('get_language').catch(() => 'en'),
  checkForUpdates: () => invoke<boolean>('check_for_updates'),
  installUpdate: () => invoke<void>('install_update'),
  openAppFolder: () => invoke<void>('open_app_folder'),
  openAppsSettings: () => invoke<void>('open_apps_settings'),
  /** Never rejects: a failed lookup just means "no notice". */
  hasLegacyInstall: (): Promise<boolean> =>
    invoke<boolean>('has_legacy_install').catch(() => false),
  showWindow: () => invoke<void>('show_window')
}
