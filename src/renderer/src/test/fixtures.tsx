import type { BulbState } from '@renderer/bindings/BulbState'
import type { MultiBulbState } from '@renderer/bindings/MultiBulbState'
import i18n from '@i18n/index'
import { useBulbStore } from '@renderer/context/BulbStore'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

export const makeBulb = (overrides: Partial<BulbState> = {}): BulbState => ({
  mac: 'aa0000000001',
  rssi: -60,
  state: true,
  sceneId: 0,
  dimming: 50,
  homeId: 0,
  roomId: 0,
  rgn: '',
  moduleName: 'ESP01',
  fwVersion: '1.0',
  groupId: 0,
  ping: 0,
  ip: '127.0.0.1',
  port: 38899,
  name: 'Living',
  online: true,
  customColors: [],
  favoriteColors: [11, 12],
  ...overrides
})

export const makeState = (
  bulbs: BulbState[],
  extra: Partial<MultiBulbState> = {}
): MultiBulbState => ({
  bulbs,
  activeBulb: bulbs[0] ?? null,
  isDiscovering: false,
  discoveryFailed: false,
  ...extra
})

/** Puts a backend state in the store, as an `on-update-bulb` event would. */
export const seedStore = (state: MultiBulbState) => {
  useBulbStore.getState().updateMultiBulbState(state)
}

export const resetStore = () => {
  seedStore(makeState([], { isDiscovering: false }))
  useBulbStore.setState({ toasts: [] })
}

export const renderApp = (ui: ReactElement, route = '/') => {
  void i18n.changeLanguage('en')
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}
