const { app, Tray, BrowserWindow, ipcMain, Menu, shell } = require('electron');

// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) app.quit();

// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const { discover, SCENES, Bulb } = require('./lib/mod');
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
 * @property {string} bulbIp
 * @property {string} bulbName
 * @property {[{ id: int, name: string, hex: string }]} customColors
 */

/** @type {Bulb | undefined} */
let bulb;

/** @type {BulbState | undefined}  */
let bulbState;

/**  @type {AppData | undefined} */
let appData;

let keepSearching = true;

const setUpBulb = async () => {
  try {
    appData = JSON.parse(fs.readFileSync(JSON_DATA_PATH, 'utf-8'));
    console.log(appData);
  } catch (e) {
    console.warn('No data file found, creating new one...');
    appData = { bulbIp: undefined };
  }

  while (!bulb && keepSearching) {
    if (appData.bulbIp) {
      console.log(`Current Stored Bulb ip:${appData.bulbIp}`);
      const [firstBulb] = await discover({ addr: appData.bulbIp, waitMs: 2500 });
      bulb = firstBulb;
    } else {
      console.log('No stored bulb ip, discovering new bulb...');
      const [firstBulb] = await discover({});
      bulb = firstBulb;
    }

    if (!bulb) {
      appData.bulbIp = undefined;
    }
  }
  if (!keepSearching) {
    return;
  }

  appData.bulbIp = bulb.address;

  const pilot = (await bulb.getPilot()).result;
  const config = (await bulb.sendRaw({ method: 'getSystemConfig' })).result;
  bulbState = Object.assign(pilot, config, {
    ip: bulb.address,
    port: bulb.bulbPort,
    name: appData.bulbName,
    customColors: appData.customColors,
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
      devTools: false,
    },
  });

  let requestConter = 0;

  ipcMain.on('bulb-state-request', async (event) => {
    console.log('Bulb State Requested');
    requestConter += 1;
    const currentRequest = requestConter;
    while (!bulb || !bulbState) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (currentRequest !== requestConter) {
        return;
      }
    }

    event.sender.send('bulb-state-response', bulbState);
    event.sender.send('get-scene-name', SCENES[bulbState.sceneId]);
  });

  ipcMain.on('add-custom-color', async (event, colorName, colorHex) => {
    console.log('Adding Custom Color');
    if (!appData.customColors || appData.customColors.length === 0) {
      appData.customColors = [];
      appData.customColors.push({ id: 0, name: colorName, hex: colorHex });
      bulbState.customColors = appData.customColors;
      fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
      return;
    }

    const lastId = appData.customColors[appData.customColors.length - 1].id;
    appData.customColors.push({ id: lastId + 1, name: colorName, hex: colorHex });
    bulbState.customColors = appData.customColors;
    console.log(appData.customColors);
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
  });

  ipcMain.on('set-custom-color', async (event, colorId) => {
    if (!bulb) return;
    bulbState.sceneId = colorId;
    bulbState.state = true;
    const colorHex = appData.customColors.find((color) => color.id === colorId).hex;
    await bulb.color(colorHex);
  });

  ipcMain.on('edit-color', async (event, colorId, newName, newHex) => {
    if (!appData.customColors) return;
    const colorIndex = appData.customColors.findIndex((color) => color.id === colorId);
    if (colorIndex === -1) return;
    appData.customColors[colorIndex] = { id: colorId, name: newName, hex: newHex };
    bulbState.customColors = appData.customColors;
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
  });

  ipcMain.on('remove-color', async (event, colorId) => {
    console.log('Removing Color', colorId);
    if (!appData.customColors) return;
    const colorIndex = appData.customColors.findIndex((color) => color.id === colorId);
    if (colorIndex === -1) return;
    appData.customColors.splice(colorIndex, 1);
    bulbState.customColors = appData.customColors;
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
  });

  ipcMain.on('toggle-bulb-state', async () => {
    bulbState.state = !bulbState.state;
    await bulb.toggle();
  });

  ipcMain.on('set-ip', async (event, ip) => {
    if (!ip || bulb) {
      return;
    }

    keepSearching = false;

    const [firstBulb] = await discover({ addr: ip });
    if (!firstBulb) {
      keepSearching = true;
      return;
    }

    bulb = firstBulb;
    appData.bulbIp = bulb.address;

    const pilot = (await bulb.getPilot()).result;
    const config = (await bulb.sendRaw({ method: 'getSystemConfig' })).result;
    bulbState = Object.assign(pilot, config, {
      ip: bulb.address,
      port: bulb.bulbPort,
      name: appData.bulbName,
    });
  });

  ipcMain.on('set-scene', async (event, sceneId) => {
    if (!bulb) return;
    bulbState.sceneId = parseInt(sceneId, 10);
    bulbState.state = true;
    await bulb.scene(bulbState.sceneId);
  });

  ipcMain.on('set-brightness', async (event, brightness) => {
    if (!bulb) return;

    bulbState.dimming = parseInt(brightness, 10);
    await bulb.brightness(bulbState.dimming);
  });

  ipcMain.on('set-bulb-name', async (event, newName) => {
    if (!bulb) return;
    appData.bulbName = newName;
    bulbState.name = newName;
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
  });

  ipcMain.on('visit-author', () => {
    shell.openExternal('https://www.github.com/MatiasTK');
  });

  win.on('close', () => {
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(appData));
    if (bulb) {
      bulb.closeConnection();
    }
    app.quit();
  });

  win.on('minimize', (event) => {
    event.preventDefault();
    win.hide();
  });

  win.loadFile('./pages/Home/index.html');
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
    { type: 'separator' },
    {
      label: 'Toggle',
      click: () => {
        if (!bulb) return;
        bulbState.state = !bulbState.state;
        bulb.toggle();
      },
    },
    { type: 'separator' },
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
