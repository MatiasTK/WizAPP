import i18n from '@i18n'
import BulbManager from '@main/bulbManager'
import { app, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'

const registerIPCEvents = (BulbManager: BulbManager) => {
  ipcMain.on('toggle-bulb-state', async () => {
    await BulbManager.toggleBulb()
  })

  ipcMain.on('set-brightness', async (_, brightness) => {
    await BulbManager.setBrightness(brightness)
  })

  ipcMain.on('set-bulb-name', async (_, name) => {
    await BulbManager.setBulbName(name)
  })

  ipcMain.on('set-ip', async (_, ip) => {
    await BulbManager.setIp(ip)
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

  ipcMain.on('open-app-folder', () => {
    shell.openPath(app.getPath('userData'))
  })

  ipcMain.handle('get-bulb', () => {
    return BulbManager.getBulbState()
  })

  ipcMain.handle('check-for-updates', async () => {
    await autoUpdater.checkForUpdatesAndNotify()

    autoUpdater.on('update-available', () => {
      return true
    })

    return false
  })

  ipcMain.handle('get-language', () => {
    return i18n.language
  })

  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })
}

export default registerIPCEvents
