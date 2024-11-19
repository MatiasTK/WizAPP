import BulbType from '@dtypes/index.d.ts';

export interface IElectronAPI {
  onUpdateBulb: (callback: (bulb: BulbType) => void) => void;
  getBulbWhenReady: () => Promise<BulbType>;
  toggleBulb: () => void;
  setBrightness: (brightness: number) => void;
  setBulbName: (name: string) => void;
  setIp: (ip: string) => void;
  visitAuthor: () => void;
  setScene: (sceneId: number) => void;
  addCustomColor: (colorName: string, colorHex: string) => void;
  setCustomColor: (colorId: number) => void;
  editCustomColor: (colorId: number, colorName: string, colorHex: string) => void;
  removeCustomColor: (colorId: number) => void;
  getVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
