const { app, Tray, BrowserWindow, ipcMain, Menu, nativeImage, Notification } = require('electron');
if (require('electron-squirrel-startup')) app.quit();

const path = require('node:path');
const { discover, SCENES, Bulb, WIZ_BULB_LISTEN_PORT } = require('wikari');
const fs = require('fs');

/** @type {Bulb | undefined} */
let bulb;
let bulbState;
let tray;
const ICONPATH = path.join(__dirname, 'assets', 'icon.ico');
const ICON = nativeImage.createFromPath(ICONPATH);
const JSONDATAPATH = path.join(app.getPath('userData'), 'config.json');

const createWindow = () => {
  const win = new BrowserWindow({
    minWidth: 900,
    minHeight: 600,
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  let appData;
  try {
    appData = JSON.parse(fs.readFileSync(JSONDATAPATH, 'utf-8'));
  } catch {
    appData = { width: 900, height: 600 };
  }
  win.setBounds({ width: appData.width, height: appData.height });

  ipcMain.on('bulb-state-request', async (event) => {
    if (bulb) {
      event.sender.send('bulb-state-response', bulbState);
      return;
    }

    try {
      const bulbIp = JSON.parse(fs.readFileSync(JSONDATAPATH, 'utf-8')).bulbIp;
      console.log('Current Stored Bulb ip:' + bulbIp);
      bulb = await new Bulb(bulbIp, WIZ_BULB_LISTEN_PORT).catch(() => {
        throw new Error();
      });
    } catch {
      console.log('Failed to connect to stored bulb, discovering new bulb...');
      const bulbs = await discover({ timeout: 5000 });
      bulb = bulbs[0];
      if (!bulb) {
        new Notification({
          title: 'WiZ APP',
          body: 'No bulb found, please make sure your bulb is connected to the same network as your computer.',
        }).show();
        appData.bulbIp = undefined;
        return;
      }

      appData.bulbIp = bulb.address;
    }

    if (bulb) {
      const pilot = (await bulb.getPilot()).result;
      const config = (await bulb.sendRaw({ method: 'getSystemConfig' })).result;
      bulbState = Object.assign(pilot, config, {
        name: appData.bulbName,
        ip: bulb.address,
        port: bulb.bulbPort,
      });
      event.sender.send('bulb-state-response', bulbState);
      event.sender.send('get-scene-name', SCENES[bulbState.sceneId]);
    }
  });

  ipcMain.on('toggle-bulb-state', async (event) => {
    bulbState.state = !bulbState.state;
    await bulb.toggle();
  });

  ipcMain.on('set-scene', async (event, sceneId) => {
    if (!bulb) return;
    bulbState.sceneId = sceneId;
    bulbState.state = true;
    await bulb.scene(parseInt(sceneId));
  });

  ipcMain.on('set-bulb-name', async (event, newName) => {
    if (!bulb) return;
    appData.bulbName = newName;
    bulbState.name = newName;
  });

  ipcMain.on('visit-author', () => {
    require('electron').shell.openExternal('https://www.github.com/MatiasTK');
  });

  win.on('close', () => {
    appData.width = win.getBounds().width;
    appData.height = win.getBounds().height;
    fs.writeFileSync(JSONDATAPATH, JSON.stringify(appData));
    app.quit();
  });

  win.on('minimize', (event) => {
    appData.width = win.getBounds().width;
    appData.height = win.getBounds().height;
    event.preventDefault();
    win.hide();
  });

  win.on('restore', () => {
    // TEMP FIX TO https://github.com/electron/electron/issues/31233
    win.setSize(appData.width, appData.height);
    win.setContentSize(appData.width, appData.height);
    win.setBounds({ width: appData.width, height: appData.height });
  });

  win.loadFile('index.html');
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    createWindow();
    tray = new Tray(ICON);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          BrowserWindow.getAllWindows().forEach((window) => {
            window.show();
          });
        },
      },
      {
        label: 'Toggle',
        click: () => {
          if (!bulb) return;
          bulbState.state = !bulbState.state;
          bulb.toggle();
        },
      },
      {
        label: 'Exit',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip('WiZ APP');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      BrowserWindow.getAllWindows().forEach((window) => {
        window.show();
      });
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    app.setName('WiZ APP');
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
