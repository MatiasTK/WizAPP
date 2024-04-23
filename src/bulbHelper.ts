import fs from 'fs';
import { CONFIG } from './constants';
import { AppData, BulbState } from './types';
import { discover, Bulb } from './lib/wikari/src/mod';

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
      console.log('CONFIG DATA FOUND:', data);
    } catch (e) {
      console.warn('CONFIG DATA NOT FOUND');
    }

    let bulb: Bulb;
    let bulbFound = false;

    while (!bulbFound) {
      if (data && data.bulbIp) {
        console.log('STORED BULB IP FOUND:', data.bulbIp);
        const res = await discover({ addr: data.bulbIp, waitMs: 2500 });
        if (res && res.length > 0) {
          bulb = res[0];
          bulbFound = true;
        }
      } else {
        console.log('NO STORED BULB IP FOUND');
        const res = await discover({});
        if (res && res.length > 0) {
          bulb = res[0];
          bulbFound = true;
        }
      }

      if (!bulbFound) {
        console.warn('NO BULB FOUND, RETRYING...');
        this.appData.bulbIp = undefined;
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
      name: data.bulbName,
      customColors: data.customColors,
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
    console.log(colorId);
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
}

export default BulbHelper;
