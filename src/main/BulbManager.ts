import { CONFIG, DISCOVER_TIMEOUT, MAX_DEFAULT_COLORS } from '@constants/index';
import { BulbConfig, BulbState, systemConfig } from '@dtypes/index';
import { Bulb, discover } from '@lib/wikari/src/mod';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import fs from 'fs';

/**
    Decorator that updates the view after the method is executed.
    Also catches if the connection is lost.
*/
function needsViewUpdate(actionName: string) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: never[]) {
      try {
        log.info('Bulb toggled');
        await originalMethod.apply(this, args);
        this.window.webContents.send('on-update-bulb', this.bulbState);
      } catch {
        log.error(`Failed to ${actionName}, connection lost`);
        await this.reconnectBulb();
      }
    };
  };
}

class BulbManager {
  private bulb: Bulb;
  // Bulb state is the state of the bulb that is sent to the renderer process, it works as a cache to avoid sending requests to the bulb
  private bulbState: BulbState;
  private appData: BulbConfig;
  private window: BrowserWindow;
  private bulbIP: string;

  constructor(window: BrowserWindow) {
    this.window = window;
    this.init();
  }

  private async init() {
    await this.setUpBulb();
  }

  private getConfigData(): BulbConfig {
    let data: BulbConfig;
    try {
      data = JSON.parse(fs.readFileSync(CONFIG, 'utf-8'));
      log.info('Config data found with bulb IP: ', data.bulbIp);
    } catch {
      data = {
        bulbIp: null,
        bulbName: null,
        customColors: [],
      };
      log.warn('Config data not found, creating new config file...');
    }
    return data;
  }

  private async searchBulb(): Promise<Bulb> {
    let isBulbFound = false;
    let bulb: Bulb = null;

    while (!isBulbFound) {
      log.info('Looking for bulb');
      if (this.bulbIP) {
        log.info('Trying to connect to bulb with IP: ', this.bulbIP);
        const res = await discover({ addr: this.bulbIP, waitMs: DISCOVER_TIMEOUT });

        if (res.length > 0) {
          bulb = res[0];
          isBulbFound = true;
        } else {
          log.error('Bulb not found with IP: ', this.bulbIP);
          this.bulbIP = null;
        }
      }

      if (!isBulbFound) {
        const res = await discover({ waitMs: DISCOVER_TIMEOUT });
        if (res.length > 0) {
          bulb = res[0];
          isBulbFound = true;
        } else {
          log.error('Bulb not found');
        }
      }

      log.info('Retrying to find bulb');
    }

    return bulb;
  }

  private async setUpBulb() {
    const configData = this.getConfigData();
    this.bulbIP = configData.bulbIp;
    this.bulb = await this.searchBulb();

    log.debug('Getting bulb state...');
    const pilot = (await this.bulb.getPilot()).result;
    const bulbConfig = (await this.bulb.sendRaw({
      method: 'getSystemConfig',
      env: '',
      params: { mac: '', rssi: 0 },
    })) as systemConfig;

    const configResult = bulbConfig.result;
    this.bulbState = {
      ...pilot,
      ...configResult,
      ip: this.bulb.address,
      port: this.bulb.bulbPort,
      name: configData && configData.bulbName ? configData.bulbName : configResult.moduleName,
      customColors: configData && configData.customColors ? configData.customColors : [],
    };

    this.appData = {
      bulbIp: this.bulbState.ip,
      bulbName: this.bulbState.name,
      customColors: this.bulbState.customColors,
    };
    this.saveConfig();

    log.debug(this.window ? 'Current window is OK' : 'Current windows is NOT DEFINED');
    log.debug(this.bulbState ? 'Bulb state is OK' : 'Bulb state is NOT DEFINED');

    this.window.webContents.send('on-update-bulb', this.bulbState);
    log.info('Sending bulb data to renderer process...');
  }

  public async getBulbState() {
    return this.bulbState;
  }

  private saveConfig() {
    fs.writeFileSync(CONFIG, JSON.stringify(this.appData));
  }

  private async reconnectBulb() {
    this.bulbState = null;
    this.bulb = null;
    this.window.webContents.send('on-update-bulb', this.bulbState);
    log.info('Reconnecting to bulb...');
    await this.setUpBulb();
  }

  @needsViewUpdate('toggle bulb')
  public async toggleBulb() {
    await this.bulb.toggle();
    this.bulbState.state = !this.bulbState.state;
  }

  @needsViewUpdate('set brightness')
  public async setBrightness(brightness: number) {
    await this.bulb.brightness(brightness);
    this.bulbState.dimming = brightness;
  }

  public setBulbName(name: string) {
    this.bulbState.name = name;
    this.appData.bulbName = name;
    this.saveConfig();
  }

  public setIp(ip: string) {
    this.bulbIP = ip;
  }

  @needsViewUpdate('set scene')
  public async setScene(sceneId: number) {
    this.bulbState.state = true;
    await this.bulb.scene(sceneId);
    this.bulbState.sceneId = sceneId;
  }

  private getCustomColorNewId() {
    if (this.bulbState.customColors.length === 0) return MAX_DEFAULT_COLORS;

    const ids = this.bulbState.customColors.map((color) => color.id);
    return Math.max(...ids) + 1;
  }

  public async addCustomColor(colorName: string, colorHex: string) {
    const newId = this.getCustomColorNewId();
    this.bulbState.customColors.push({ id: newId, name: colorName, hex: colorHex });
    this.appData.customColors = this.bulbState.customColors;
    this.saveConfig();
  }

  @needsViewUpdate('set custom color')
  public async setCustomColor(colorId: number) {
    const color = this.bulbState.customColors.find((c) => c.id === colorId);
    if (!color) return;
    this.bulbState.state = true;
    this.bulbState.sceneId = colorId;
    await this.bulb.color(color.hex as `#${string}`);
  }

  public async editCustomColor(colorId: number, colorName: string, colorHex: string) {
    const color = this.bulbState.customColors.find((c) => c.id === colorId);
    if (!color) return;
    color.name = colorName;
    color.hex = colorHex;
    this.appData.customColors = this.bulbState.customColors;
    this.saveConfig();
  }

  public async removeCustomColor(colorId: number) {
    this.bulbState.customColors = this.bulbState.customColors.filter((c) => c.id !== colorId);
    this.appData.customColors = this.bulbState.customColors;
    this.saveConfig();
  }

  public endConnection() {
    if (this.bulb) {
      this.bulb.closeConnection();
      log.info('Connection with bulb closed');
    }
  }
}

export default BulbManager;
