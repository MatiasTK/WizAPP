import { vi } from 'vitest'

/**
 * Stand-in for `lib/api`. Use it with
 * `vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))`.
 */
export const api = {
  onUpdateBulb: vi.fn(() => () => undefined),
  onShowToast: vi.fn(() => () => undefined),
  getBulbs: vi.fn(() => Promise.resolve({ bulbs: [], activeBulb: null })),
  getSettings: vi.fn(() => Promise.resolve({ theme: 'system', language: 'auto' })),
  setSettings: vi.fn(() => Promise.resolve()),
  getLanguage: vi.fn(() => Promise.resolve('en')),
  toggleBulb: vi.fn(() => Promise.resolve()),
  toggleBulbByIp: vi.fn(() => Promise.resolve()),
  setBrightness: vi.fn(() => Promise.resolve()),
  setScene: vi.fn(() => Promise.resolve()),
  setCustomColor: vi.fn(() => Promise.resolve()),
  setAllBulbs: vi.fn(() => Promise.resolve([] as string[])),
  applyToAll: vi.fn(() => Promise.resolve([] as string[])),
  setBulbName: vi.fn(() => Promise.resolve()),
  addCustomColor: vi.fn(() => Promise.resolve()),
  editCustomColor: vi.fn(() => Promise.resolve()),
  removeCustomColor: vi.fn(() => Promise.resolve()),
  toggleFavoriteColor: vi.fn(() => Promise.resolve()),
  setFavoriteColorsOrder: vi.fn(() => Promise.resolve()),
  setBulbsOrder: vi.fn(() => Promise.resolve()),
  setActiveBulb: vi.fn(() => Promise.resolve()),
  addBulbByIp: vi.fn(() => Promise.resolve('added')),
  deleteBulb: vi.fn(() => Promise.resolve()),
  probeBulb: vi.fn(() => Promise.resolve()),
  retryDiscovery: vi.fn(() => Promise.resolve()),
  deleteProfile: vi.fn(() => Promise.resolve()),
  checkForUpdates: vi.fn(() => Promise.resolve(false)),
  installUpdate: vi.fn(() => Promise.resolve()),
  openAppFolder: vi.fn(() => Promise.resolve()),
  openAppsSettings: vi.fn(() => Promise.resolve()),
  hasLegacyInstall: vi.fn(() => Promise.resolve(false)),
  showWindow: vi.fn(() => Promise.resolve()),
  dismissToast: vi.fn(() => Promise.resolve())
}
