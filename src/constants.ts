import path from 'node:path';
import { app, nativeImage } from 'electron';
const icon = require('./assets/icon.ico');

const ICON = nativeImage.createFromPath(path.join(__dirname, icon));
const CONFIG = path.join(app.getPath('userData'), 'config.json');
const MIN_WIDTH = 900;
const MIN_HEIGHT = 600;
const HIDE_MENU = true;

export { ICON, CONFIG, MIN_WIDTH, MIN_HEIGHT, HIDE_MENU };
