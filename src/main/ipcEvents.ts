import { app, ipcMain, shell } from 'electron';
import BulbManager from './BulbManager';
import { AUTHOR_URL } from '@constants/index';

const registerIPCEvents = (BulbManager: BulbManager) => {
  ipcMain.on('toggle-bulb-state', async () => {
    await BulbManager.toggleBulb();
  });

  ipcMain.on('visit-author', () => {
    shell.openExternal(AUTHOR_URL);
  });

  ipcMain.on('set-brightness', async (event, brightness) => {
    await BulbManager.setBrightness(brightness);
  });

  ipcMain.on('set-bulb-name', async (event, name) => {
    await BulbManager.setBulbName(name);
  });

  //TODO: TEST!
  ipcMain.on('set-ip', async (event, ip) => {
    await BulbManager.setIp(ip);
  });

  ipcMain.on('set-scene', async (event, sceneId) => {
    await BulbManager.setScene(sceneId);
  });

  ipcMain.on('add-custom-color', async (event, colorName, colorHex) => {
    await BulbManager.addCustomColor(colorName, colorHex);
  });

  ipcMain.on('set-custom-color', async (event, colorId) => {
    await BulbManager.setCustomColor(colorId);
  });

  ipcMain.on('edit-color', async (event, colorId, colorName, colorHex) => {
    await BulbManager.editCustomColor(colorId, colorName, colorHex);
  });

  ipcMain.on('remove-color', async (event, colorId) => {
    await BulbManager.removeCustomColor(colorId);
  });

  ipcMain.handle('get-bulb', () => {
    return BulbManager.getBulbState();
  });

  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });
};

export default registerIPCEvents;
