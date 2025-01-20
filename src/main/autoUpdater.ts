import log from 'electron-log'
import { autoUpdater } from 'electron-updater'
import path from 'path'

autoUpdater.logger = log
if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true
  autoUpdater.allowPrerelease = true
  autoUpdater.updateConfigPath = path.join(path.resolve(), 'dev-app-update.yml')
}

export default function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info)
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater.', err)
  })

  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress...', progress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded.', info)
  })
}
