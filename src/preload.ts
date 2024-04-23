// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { BulbState } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  bulbStateRequest: () => ipcRenderer.send('bulb-state-request'),
  bulbStateResponse: (callback: (bulb: BulbState) => void) =>
    ipcRenderer.on('bulb-state-response', (_, bulb) => callback(bulb)),
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
});
