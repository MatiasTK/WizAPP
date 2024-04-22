export interface IElectronAPI {
  bulbStateRequest: () => void;
  bulbStateResponse: (callback: (_: Electron.IpcRendererEvent, bulb: BulbState) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
