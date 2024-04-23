import path from 'node:path';
import { app, nativeImage } from 'electron';
import icon from './assets/icon.ico';

const ICON = nativeImage.createFromPath(path.join(__dirname, icon));
const CONFIG = path.join(app.getPath('userData'), 'config.json');
const AUTHOR_URL = 'https://www.github.com/MatiasTK';
const MIN_WIDTH = 900;
const MIN_HEIGHT = 600;
const HIDE_MENU = true;

export { ICON, CONFIG, MIN_WIDTH, MIN_HEIGHT, HIDE_MENU, AUTHOR_URL };
