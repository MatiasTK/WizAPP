const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  bulbStateRequest: (callback) => ipcRenderer.send('bulb-state-request', callback),
  bulbStateResponse: (callback) => ipcRenderer.on('bulb-state-response', callback),
  toggleBulb: (callback) => ipcRenderer.send('toggle-bulb-state', callback),
  getSceneName: (callback) => ipcRenderer.on('get-scene-name', callback),
  setScene: (sceneId) => ipcRenderer.send('set-scene', sceneId),
  setIp: (ip) => ipcRenderer.send('set-ip', ip),
  visitAuthor: () => ipcRenderer.send('visit-author'),
  setBulbName: (newName) => ipcRenderer.send('set-bulb-name', newName),
});
