import icon from '@resources/icon.ico?asset'
import { app } from 'electron'
import path from 'node:path'

const ICON = icon
const CONFIG = path.join(app.getPath('userData'), 'config.json')
const AUTHOR_URL = 'https://www.github.com/MatiasTK'
const MIN_WIDTH = 900
const MIN_HEIGHT = 600
const HIDE_MENU = true
const RELEASE_URL = 'https://api.github.com/repos/MatiasTK/WizAPP/releases/latest'
const MAX_DEFAULT_COLORS = 33
const DISCOVER_DELAY = 5000
const DISCOVER_TIMEOUT = 5000
const SANDBOX = false

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
  SANDBOX
}
