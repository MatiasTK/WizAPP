const { app, Tray, BrowserWindow, ipcMain, Menu, shell } = require('electron');

// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) app.quit();

// eslint-disable-next-line no-unused-vars
const { discover, SCENES, Bulb } = require('wikari');
const fs = require('fs');
const { ICON, JSON_DATA_PATH, PRELOAD, MIN_WIDTH, MIN_HEIGHT, HIDE_MENU } = require('./constants');

/**
 * @typedef {Object} BulbState
 * @property {string} mac
 * @property {number} rssi
 * @property {string} src
 * @property {boolean} state
 * @property {number} sceneId
 * @property {number} temp
 * @property {number} dimming
 * @property {number} homeId
 * @property {number} roomId
 * @property {string} rgn
 * @property {string} moduleName
 * @property {string} fwVersion
 * @property {number} groupId
 * @property {number} ping
 * @property {string} ip
 * @property {number} port
 * @property {string} name
 */

/**
 * @typedef {Object} AppData
 * @property {number} width
 * @property {number} height
 * @property {string} bulbIp
 * @property {string} bulbName
 */

/** @type {Bulb | undefined} */
let bulb;

/** @type {BulbState | undefined}  */
let bulbState;

/**  @type {AppData | undefined} */
let appData;

const setUpBulb = async () => {
  try {
    appData = JSON.parse(fs.readFileSync(JSON_DATA_PATH, 'utf-8'));
    console.log(appData);
  } catch (e) {
    appData = { width: MIN_WIDTH, height: MIN_HEIGHT };
  }

  let { bulbIp } = appData;
  console.log(`Current Stored Bulb ip:${bulbIp}`);
  while (!bulb) {
    if (bulbIp) {
      const [firstBulb] = await discover({ bulbIp });
      bulb = firstBulb;
    } else {
      console.log('No stored bulb ip, discovering new bulb...');
      const [firstBulb] = await discover({});
      bulb = firstBulb;
    }

    if (!bulb) {
      appData.bulbIp = undefined;
      bulbIp = undefined;
    }
  }

  appData.bulbIp = bulb.address;

  const pilot = (await bulb.getPilot()).result;
  const config = (await bulb.sendRaw({ method: 'getSystemConfig' })).result;
  bulbState = Object.assign(pilot, config, {
    ip: bulb.address,
    port: bulb.bulbPort,
    name: appData.bulbName,
  });
};

const createWindow = () => {
  const win = new BrowserWindow({
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    icon: ICON,
    autoHideMenuBar: HIDE_MENU,
    webPreferences: {
      preload: PRELOAD,
    },
  });

  win.setBounds({ width: appData.width, height: appData.height });

  ipcMain.on('bulb-state-request', async (event) => {
    if (bulb) {
      event.sender.send('bulb-state-response', bulbState);
      event.sender.send('get-scene-name', SCENES[bulbState.sceneId]);
      return;
    }

    const loop = setInterval(() => {
      console.log('Checking bulb state next check in 5 seconds...');
      if (bulb) {
        event.sender.send('bulb-state-response', bulbState);
        event.sender.send('get-scene-name', SCENES[bulbState.sceneId]);
        clearInterval(loop);
      }
    }, 5000);
  });

  ipcMain.on('toggle-bulb-state', async () => {
    bulbState.state = !bulbState.state;
    await bulb.toggle();
  });

  ipcMain.on('set-scene', async (event, sceneId) => {
    if (!bulb) return;
    bulbState.sceneId = parseInt(sceneId, 10);
    bulbState.state = true;
    await bulb.scene(bulbState.sceneId);
  });

  ipcMain.on('set-bulb-name', async (event, newName) => {
    if (!bulb) return;
    appData.bulbName = newName;
    bulbState.name = newName;
  });

  ipcMain.on('visit-author', () => {
    shell.openExternal('https://www.github.com/MatiasTK');
  });

  win.on('close', () => {
    appData.width = win.getBounds().width;
    appData.height = win.getBounds().height;
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
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

const createTray = () => {
  const tray = new Tray(ICON);
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
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.show();
    });
  });

  app.whenReady().then(() => {
    setUpBulb();
    createWindow();
    createTray();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
