import { BrowserWindow, Menu, Tray } from 'electron';
import { ICON } from './constants';
import BulbHelper from './bulbHelper';
import i18n from './i18n';

const createTray = (mainWindow: BrowserWindow, app: Electron.App, bulbHelper: BulbHelper) => {
  const tray = new Tray(ICON);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: i18n.t('tray.show'),
      click: () => {
        mainWindow.show();
      },
    },
    { type: 'separator' },
    {
      label: i18n.t('tray.toggle'),
      click: () => {
        bulbHelper.toggleBulb();
      },
    },
    { type: 'separator' },
    {
      label: i18n.t('tray.quit'),
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('WiZ App');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow.show();
  });
};

export default createTray;
