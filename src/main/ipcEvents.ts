import i18n from '@i18n'
import BulbManager from '@main/bulbManager'
import { app, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'

const registerIPCEvents = (BulbManager: BulbManager) => {
  // --- Active bulb operations ---
  ipcMain.on('toggle-bulb-state', async () => {
    await BulbManager.toggleBulb()
  })

  ipcMain.on('set-brightness', async (_, brightness) => {
    await BulbManager.setBrightness(brightness)
  })

  ipcMain.on('set-bulb-name', async (_, name, ip) => {
    await BulbManager.setBulbName(name, ip)
  })

  ipcMain.on('set-scene', async (_, sceneId) => {
    await BulbManager.setScene(sceneId)
  })

  ipcMain.on('add-custom-color', async (_, colorName, colorHex) => {
    await BulbManager.addCustomColor(colorName, colorHex)
  })

  ipcMain.on('set-custom-color', async (_, colorId) => {
    await BulbManager.setCustomColor(colorId)
  })

  ipcMain.on('edit-color', async (_, colorId, colorName, colorHex) => {
    await BulbManager.editCustomColor(colorId, colorName, colorHex)
  })

  ipcMain.on('remove-color', async (_, colorId) => {
    await BulbManager.removeCustomColor(colorId)
  })

  ipcMain.on('toggle-favorite-color', async (_, colorId) => {
    await BulbManager.toggleFavoriteColor(colorId)
  })

  ipcMain.on('set-favorite-colors-order', async (_, favoriteColors) => {
    await BulbManager.setFavoriteColorsOrder(favoriteColors)
  })

  // --- Multi-bulb operations ---
  ipcMain.on('set-active-bulb', (_, ip) => {
    BulbManager.setActiveBulb(ip)
  })

  ipcMain.on('toggle-bulb-by-ip', async (_, ip) => {
    await BulbManager.toggleBulbByIp(ip)
  })

  ipcMain.on('add-bulb-by-ip', async (_, ip) => {
    await BulbManager.addBulbByIp(ip)
  })

  ipcMain.on('delete-bulb', (_, ip) => {
    BulbManager.deleteBulb(ip)
  })

  ipcMain.on('retry-discovery', async () => {
    await BulbManager.retryDiscovery()
  })

  ipcMain.on('delete-profile', () => {
    BulbManager.deleteProfile()
  })

  // --- Queries ---
  ipcMain.handle('get-bulbs', () => {
    return BulbManager.getMultiBulbState()
  })

  ipcMain.handle('check-for-updates', async () => {
    const result = await autoUpdater.checkForUpdates()

    autoUpdater.on('update-available', () => {
      return true
    })

    autoUpdater.on('update-not-available', () => {
      return false
    })

    return result?.updateInfo && result.versionInfo
      ? result.updateInfo.version !== result.versionInfo.version
      : false
  })

  ipcMain.handle('get-language', () => {
    return i18n.language
  })

  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  // --- Utility ---
  ipcMain.on('open-app-folder', () => {
    shell.openPath(app.getPath('userData'))
  })
}

export default registerIPCEvents
