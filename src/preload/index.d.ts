import { ElectronAPI } from '@electron-toolkit/preload'
import IElectronAPI from '../types/electronAPI'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IElectronAPI
  }
}
