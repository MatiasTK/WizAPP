import fs from 'fs';
import { CONFIG } from './constants';
import { AppData, BulbState } from './types';
import { discover, Bulb } from './lib/wikari/src/mod';
import log from 'electron-log';
import { BrowserWindow } from 'electron';

type systemConfig = {
  method: string;
  params: Record<string, unknown>;
  result: {
    homeId: number;
    roomId: number;
    rgn: string;
    moduleName: string;
    fwVersion: string;
    groupId: number;
    ping: number;
  };
};

class BulbHelper {
  private bulb: Bulb;
  private bulbState: BulbState;
  private bulbStateReady: Promise<void>;
  private appData: AppData;
  private resolveBulbStateReady: () => void;
  private currentWindow: BrowserWindow;

  constructor(window: BrowserWindow) {
    this.currentWindow = window;
    this.bulbStateReady = new Promise((resolve) => {
      this.resolveBulbStateReady = resolve;
    });
    this.init();
  }

  private async init() {
    await this.setUpBulb();
  }

  private async setUpBulb() {
    let data: AppData;
    try {
      data = JSON.parse(fs.readFileSync(CONFIG, 'utf-8'));
      log.info('Config data found with bulb IP:', data.bulbIp);
    } catch (e) {
      data = {
        bulbIp: undefined,
        bulbName: undefined,
        customColors: [],
      };
      log.warn('Config data not found, creating new config file...');
    }

    let bulb: Bulb;
    let bulbFound = false;

    while (!bulbFound) {
      log.info('Looking for bulb...');
      if (data && data.bulbIp) {
        log.info('Using IP from config:', data.bulbIp);
        const res = await discover({ addr: data.bulbIp, waitMs: 2500 });
        if (res && res.length > 0) {
          log.info('BULB FOUND:', res[0].address);
          bulb = res[0];
          data.bulbIp = res[0].address;
          bulbFound = true;
        } else {
          log.warn('Could not find bulb at IP:', data.bulbIp);
        }
      } else {
        log.info('Searching for bulb on network...');
        const res = await discover({});
        if (res && res.length > 0) {
          log.info('BULB FOUND:', res[0].address);
          bulb = res[0];
          data.bulbIp = res[0].address;
          bulbFound = true;
        } else {
          log.warn('Could not find bulb on network');
        }
      }

      if (!bulbFound && data) {
        log.warn('Retrying to find bulb in 5 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        data.bulbIp = undefined;
      }
    }

    log.debug('Getting bulb state...');
    const pilot = (await bulb.getPilot()).result;
    const config = (await bulb.sendRaw({
      method: 'getSystemConfig',
      env: '',
      params: { mac: '', rssi: 0 },
    })) as systemConfig;
    const configResult = config.result;
    this.bulbState = {
      ...pilot,
      ...configResult,
      ip: bulb.address,
      port: bulb.bulbPort,
      name: data && data.bulbName ? data.bulbName : configResult.moduleName,
      customColors: data && data.customColors ? data.customColors : [],
    };

    this.bulb = bulb;
    this.appData = data;
    this.resolveBulbStateReady();

    log.debug(this.currentWindow ? 'Current window is OK' : 'Current windows is NOT DEFINED');
    log.debug(this.bulbState ? 'Bulb state is OK' : 'Bulb state is NOT DEFINED');

    this.currentWindow.webContents.send('on-update-bulb', this.bulbState);
    log.info('Sending bulb data to renderer process...');
  }

  private async reconnectBulb() {
    // this.bulb.closeConnection();
    this.bulbState = undefined;
    this.bulb = undefined;
    this.currentWindow.webContents.send('on-update-bulb', this.bulbState);
    log.info('Reconnecting to bulb...');
    await this.setUpBulb();
  }

  public async toggleBulb() {
    try {
      await this.bulbStateReady;
      await this.bulb.toggle();
      this.bulbState.state = !this.bulbState.state;
      log.info('Bulb toggled');
      this.currentWindow.webContents.send('on-update-bulb', this.bulbState);
    } catch {
      log.error('Failed to toggle bulb, connection lost');
      await this.reconnectBulb();
    }
  }

  public async getBulbState() {
    await this.bulbStateReady;
    return this.bulbState;
  }

  public async setBrightness(brightness: number) {
    try {
      await this.bulbStateReady;
      await this.bulb.brightness(brightness);
      this.bulbState.dimming = brightness;
    } catch {
      log.error('Failed to set brightness, connection lost');
      await this.reconnectBulb();
    }
  }

  private saveConfig() {
    fs.writeFileSync(CONFIG, JSON.stringify(this.appData));
  }

  public async setBulbName(name: string) {
    await this.bulbStateReady;
    this.bulbState.name = name;
    this.appData.bulbName = name;
    this.saveConfig();
  }

  public setIp(ip: string) {
    this.appData.bulbIp = ip;
    this.saveConfig();
    this.setUpBulb();
  }

  public async setScene(sceneId: number) {
    try {
      await this.bulbStateReady;
      this.bulbState.state = true;
      await this.bulb.scene(sceneId);
      this.bulbState.sceneId = sceneId;
    } catch {
      log.error('Failed to set scene, connection lost');
      await this.reconnectBulb();
    }
  }

  private getCustomColorNewId() {
    if (this.bulbState.customColors.length === 0) return 33;

    const ids = this.bulbState.customColors.map((color) => color.id);
    return Math.max(...ids) + 1;
  }

  public async addCustomColor(colorName: string, colorHex: string) {
    await this.bulbStateReady;
    const newId = this.getCustomColorNewId();
    this.bulbState.customColors.push({ id: newId, name: colorName, hex: colorHex });
    this.appData.customColors = this.bulbState.customColors;
    this.saveConfig();
  }

  public async setCustomColor(colorId: number) {
    try {
      await this.bulbStateReady;
      const color = this.bulbState.customColors.find((c) => c.id === colorId);
      if (!color) return;
      this.bulbState.state = true;
      this.bulbState.sceneId = colorId;
      await this.bulb.color(color.hex as `#${string}`);
    } catch {
      log.error('Failed to set custom color, connection lost');
      await this.reconnectBulb();
    }
  }

  public async editCustomColor(colorId: number, colorName: string, colorHex: string) {
    await this.bulbStateReady;
    const color = this.bulbState.customColors.find((c) => c.id === colorId);
    if (!color) return;
    color.name = colorName;
    color.hex = colorHex;
    this.appData.customColors = this.bulbState.customColors;
    this.saveConfig();
  }

  public async removeCustomColor(colorId: number) {
    await this.bulbStateReady;
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

export default BulbHelper;
