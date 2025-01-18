import icon from '@assets/icon.ico';
import { app, nativeImage } from 'electron';
import path from 'node:path';

const ICON = nativeImage.createFromPath(path.join(__dirname, icon));
const CONFIG = path.join(app.getPath('userData'), 'config.json');
const AUTHOR_URL = 'https://www.github.com/MatiasTK';
const MIN_WIDTH = 900;
const MIN_HEIGHT = 600;
const HIDE_MENU = true;
const RELEASE_URL = 'https://api.github.com/repos/MatiasTK/WizAPP/releases/latest';
const MAX_DEFAULT_COLORS = 33;
const DISCOVER_DELAY = 5000;
const DISCOVER_TIMEOUT = 5000;

export {
  AUTHOR_URL,
  CONFIG,
  DISCOVER_DELAY,
  DISCOVER_TIMEOUT,
  HIDE_MENU,
  ICON,
  MAX_DEFAULT_COLORS,
  MIN_HEIGHT,
  MIN_WIDTH,
  RELEASE_URL,
};
