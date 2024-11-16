import fs from 'fs';
import { CONFIG } from './constants';
import { AppData, BulbState } from './types';
import { discover, Bulb } from './lib/wikari/src/mod';
import log from 'electron-log';

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

  constructor() {
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
        log.warn('Retrying to find bulb');
        data.bulbIp = undefined;
      }
    }

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
  }

  public async toggleBulb() {
    await this.bulbStateReady;
    this.bulbState.state = !this.bulbState.state;
    await this.bulb.toggle();
  }

  public async getBulbState() {
    await this.bulbStateReady;
    return this.bulbState;
  }

  public async setBrightness(brightness: number) {
    await this.bulbStateReady;
    this.bulbState.dimming = brightness;
    await this.bulb.brightness(brightness);
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
    await this.bulbStateReady;
    this.bulbState.state = true;
    this.bulbState.sceneId = sceneId;
    await this.bulb.scene(sceneId);
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
    await this.bulbStateReady;
    const color = this.bulbState.customColors.find((c) => c.id === colorId);
    if (!color) return;
    this.bulbState.state = true;
    this.bulbState.sceneId = colorId;
    await this.bulb.color(color.hex as `#${string}`);
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
