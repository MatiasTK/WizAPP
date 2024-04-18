const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  bulbStateRequest: (callback) => ipcRenderer.send('bulb-state-request', callback),
  bulbStateResponse: (callback) => ipcRenderer.on('bulb-state-response', callback),
  toggleBulb: (callback) => ipcRenderer.send('toggle-bulb-state', callback),
  getSceneName: (callback) => ipcRenderer.on('get-scene-name', callback),
  setScene: (sceneId) => ipcRenderer.send('set-scene', sceneId),
  setBrightness: (brightness) => ipcRenderer.send('set-brightness', brightness),
  addCustomColor: (colorName, colorHex) =>
    ipcRenderer.send('add-custom-color', colorName, colorHex),
  setCustomColor: (colorId) => ipcRenderer.send('set-custom-color', colorId),
  editColor: (colorId, newName, newHex) => ipcRenderer.send('edit-color', colorId, newName, newHex),
  removeColor: (colorId) => ipcRenderer.send('remove-color', colorId),
  setIp: (ip) => ipcRenderer.send('set-ip', ip),
  visitAuthor: () => ipcRenderer.send('visit-author'),
  setBulbName: (newName) => ipcRenderer.send('set-bulb-name', newName),
});
