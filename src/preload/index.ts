import { BulbState } from '@/types/bulbState'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  onUpdateBulb: (callback: (bulb: BulbState) => void) =>
    ipcRenderer.on('on-update-bulb', (_, bulb: BulbState) => callback(bulb)),
  getBulbWhenReady: () => ipcRenderer.invoke('get-bulb'),
  toggleBulb: () => ipcRenderer.send('toggle-bulb-state'),
  setBrightness: (brightness: number) => ipcRenderer.send('set-brightness', brightness),
  setBulbName: (name: string) => ipcRenderer.send('set-bulb-name', name),
  setIp: (ip: string) => ipcRenderer.send('set-ip', ip),
  visitAuthor: () => ipcRenderer.send('visit-author'),
  setScene: (sceneId: number) => ipcRenderer.send('set-scene', sceneId),
  addCustomColor: (colorName: string, colorHex: string) =>
    ipcRenderer.send('add-custom-color', colorName, colorHex),
  setCustomColor: (colorName: string) => ipcRenderer.send('set-custom-color', colorName),
  editCustomColor: (colorId: number, colorName: string, colorHex: string) =>
    ipcRenderer.send('edit-color', colorId, colorName, colorHex),
  removeCustomColor: (colorId: number) => ipcRenderer.send('remove-color', colorId),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  getVersion: () => ipcRenderer.invoke('get-version')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
