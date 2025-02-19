import { BulbState } from './bulbState'
import { CustomColor } from './customColor'

export interface BulbConfig {
  bulbName: string
  bulbIp: string
  customColors: CustomColor[]
  favoriteColors: Array<BulbState['sceneId']>
}
