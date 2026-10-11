import { BulbState } from '@shared/types/bulbState'
import { CustomColor } from '@shared/types/customColor'

export interface BulbConfigEntry {
  bulbIp: string
  bulbName: string
}

export interface AppConfig {
  bulbs: BulbConfigEntry[]
  activeBulbIp: string | null
  customColors: CustomColor[]
  favoriteColors: Array<BulbState['sceneId']>
}
