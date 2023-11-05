const { app, Tray, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const { discover, SCENES } = require('wikari');

let bulb;
let bulbState;
let tray;

const createWindow = () => {
  const win = new BrowserWindow({
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  ipcMain.on('bulb-state-request', async (event) => {
    if (bulb) {
      event.sender.send('bulb-state-response', bulbState);
      return;
    }

    const bulbs = await discover({});

    bulb = bulbs[0];

    if (!bulb) return console.log('No bulbs found!');
    else console.log('Bulb found!');

    if (bulb) {
      const pilot = (await bulb.getPilot()).result;
      const config = (await bulb.sendRaw({ method: 'getSystemConfig' })).result;
      bulbState = Object.assign(pilot, config);
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
    console.log(sceneId);
    await bulb.scene(parseInt(sceneId));
  });

  ipcMain.on('visit-author', () => {
    require('electron').shell.openExternal('https://www.github.com/MatiasTK');
  });

  win.on('close', () => {
    app.quit();
  });

  win.on('minimize', (event) => {
    event.preventDefault();
    win.hide();
  });

  win.loadFile('index.html');
};

app.whenReady().then(() => {
  createWindow();
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
