const path = require('node:path');
const { app, nativeImage } = require('electron');

const ICON = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.ico'));
const JSON_DATA_PATH = path.join(app.getPath('userData'), 'config.json');
const PRELOAD = path.join(__dirname, 'preload.js');
const MIN_WIDTH = 900;
const MIN_HEIGHT = 600;
const HIDE_MENU = true;

module.exports = {
  ICON,
  JSON_DATA_PATH,
  PRELOAD,
  MIN_WIDTH,
  MIN_HEIGHT,
  HIDE_MENU,
};
