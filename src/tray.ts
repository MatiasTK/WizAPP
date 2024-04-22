import { BrowserWindow, Menu, Tray } from 'electron';
import { ICON } from './constants';

const createTray = (mainWindow: BrowserWindow, app: Electron.App) => {
  const tray = new Tray(ICON);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Toggle Bulb',
      click: () => {
        // TODO
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
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
