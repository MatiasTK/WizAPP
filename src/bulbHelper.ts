import fs from 'fs';
import { CONFIG } from './constants';
import { AppData, BulbState } from './types';
import { discover, Bulb } from '../lib/mod';

type systemConfig = {
  method: string;
  params: Record<string, any>;
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

export const setUpBulb = async (): Promise<BulbState> => {
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
      let res = await discover({ addr: data.bulbIp, waitMs: 2500 });
      if (res && res.length > 0) {
        bulb = res[0];
        bulbFound = true;
      }
    } else {
      console.log('NO STORED BULB IP FOUND');
      let res = await discover({});
      if (res && res.length > 0) {
        bulb = res[0];
        bulbFound = true;
      }
    }
  }

  const pilot = (await bulb.getPilot()).result;
  const config = (await bulb.sendRaw({
    method: 'getSystemConfig',
    env: '',
    params: { mac: '', rssi: 0 },
  })) as systemConfig;
  const configResult = config.result;
  return {
    ...pilot,
    ...configResult,
    ip: bulb.address,
    port: bulb.bulbPort,
    name: data.bulbName,
    customColors: data.customColors,
  };
};
