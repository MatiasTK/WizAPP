import { BulbState } from './bulbState'

export interface MultiBulbState {
  bulbs: BulbState[]
  activeBulb: BulbState | null
  isDiscovering: boolean
  discoveryFailed: boolean
}
