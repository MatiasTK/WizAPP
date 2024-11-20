export type AppData = {
  bulbName: string;
  bulbIp: string;
  customColors: Array<{ id: number; name: string; hex: string }>;
};

export type BulbState = {
  mac: string;
  rssi: number;
  src?: string;
  state: boolean;
  sceneId: number;
  temp?: number;
  speed?: number;
  r?: number;
  g?: number;
  b?: number;
  c?: number;
  w?: number;
  dimming?: number;
  homeId: number;
  roomId: number;
  rgn: string;
  moduleName: string;
  fwVersion: string;
  groupId: number;
  ping: number;
  ip: string;
  port: number;
  name: string;
  customColors: Array<{ id: number; name: string; hex: string }>;
};

export type systemConfig = {
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
