import { BrowserWindow, Menu, Tray } from 'electron';
import { ICON } from './constants';
import BulbManager from './BulbManager';
import i18n from './i18n';
import log from 'electron-log';

const createTray = (mainWindow: BrowserWindow, app: Electron.App, bulbHelper: BulbManager) => {
  const tray = new Tray(ICON);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: i18n.t('tray.show'),
      click: () => {
        log.info('Tray show option clicked, restoring window...');
        mainWindow.show();
        log.debug('Window size is:', mainWindow.getSize());
      },
    },
    { type: 'separator' },
    {
      label: i18n.t('tray.toggle'),
      click: () => {
        log.debug('Toggling bulb from tray...');
        bulbHelper.toggleBulb();
      },
    },
    { type: 'separator' },
    {
      label: i18n.t('tray.quit'),
      click: () => {
        log.info('Quitting app from tray...');
        app.quit();
      },
    },
  ]);

  tray.setToolTip('WiZ App');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    log.info('Tray icon clicked, restoring window...');
    mainWindow.show();
  });
};

export default createTray;
